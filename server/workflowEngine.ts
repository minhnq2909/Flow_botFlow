import type {
  BotFlowEdge,
  NodeType,
  NodeExecutionState,
  WorkflowDocument,
  WorkflowNodeData,
  WorkflowRunResult,
} from '../src/features/flow-builder/flow-builder.types';
import { traceNodeExecution, traceWorkflowRun } from './langfuseTelemetry';
import type { KnowledgeBase, LlmService, VectorStoreService, WebSearchService } from './types';

const now = () => new Date().toISOString();
const aliasNodeTypes = new Set(['begin', 'retrieval', 'web_search', 'llm', 'answer', 'end']);

const resolvePath = (
  source: Record<string, unknown>,
  path: string,
  aliases: Record<string, unknown> = {},
): unknown => {
  const [rootKey, ...rest] = path.split('.');
  const root = aliases[rootKey] ?? source[rootKey];

  if (root === undefined && aliasNodeTypes.has(rootKey)) {
    return '';
  }
  if (root === undefined) {
    throw new Error(`VARIABLE_NOT_FOUND: ${path}`);
  }

  return rest.reduce<unknown>((current, key) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    throw new Error(`VARIABLE_NOT_FOUND: ${path}`);
  }, root);
};

export const resolveTemplate = (
  template: string,
  variables: Record<string, unknown>,
  aliases: Record<string, unknown> = {},
) =>
  template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, key: string) => {
    const value = resolvePath(variables, key.trim(), aliases);
    return typeof value === 'string' ? value : JSON.stringify(value);
  });

const buildUpstreamAliases = (
  node: WorkflowNodeData,
  edges: BotFlowEdge[],
  nodeById: Map<string, WorkflowNodeData>,
  variables: Record<string, unknown>,
) =>
  edges
    .filter((edge) => edge.target === node.id)
    .reduce<Record<string, unknown>>((aliases, edge) => {
      const sourceNode = nodeById.get(edge.source);
      const sourceOutput = variables[edge.source];
      if (sourceNode && sourceOutput !== undefined) {
        aliases[sourceNode.type] = sourceOutput;
      }
      return aliases;
    }, {});

const topologicalSort = (nodes: WorkflowNodeData[], edges: BotFlowEdge[]) => {
  const ids = new Set(nodes.map((node) => node.id));
  const indegree = new Map(nodes.map((node) => [node.id, 0]));
  const outgoing = new Map<string, string[]>();

  edges.forEach((edge) => {
    if (!ids.has(edge.source) || !ids.has(edge.target)) throw new Error('INVALID_EDGE');
    indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1);
    outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge.target]);
  });

  const queue = nodes.filter((node) => indegree.get(node.id) === 0).map((node) => node.id);
  const sorted: string[] = [];

  while (queue.length > 0) {
    const id = queue.shift();
    if (!id) continue;
    sorted.push(id);
    (outgoing.get(id) ?? []).forEach((target) => {
      indegree.set(target, (indegree.get(target) ?? 0) - 1);
      if (indegree.get(target) === 0) queue.push(target);
    });
  }

  if (sorted.length !== nodes.length) throw new Error('CYCLE_DETECTED');
  return sorted;
};

export class WorkflowEngine {
  constructor(
    private readonly knowledgeBases: Map<string, KnowledgeBase>,
    private readonly vectorStoreService: VectorStoreService,
    private readonly webSearchService: WebSearchService,
    private readonly llmService: LlmService,
  ) {}

  async run(
    workflowDocument: WorkflowDocument,
    inputs: Record<string, unknown>,
  ): Promise<WorkflowRunResult> {
    return traceWorkflowRun(
      {
        input: inputs,
        metadata: {
          workflowId: workflowDocument.workflow.id,
          workflowName: workflowDocument.workflow.name,
          workflowVersion: workflowDocument.workflow.version,
          schemaVersion: workflowDocument.schemaVersion,
          nodeCount: workflowDocument.workflow.nodes.length,
          environment: process.env.APP_ENV ?? 'development',
          applicationVersion: process.env.npm_package_version,
        },
      },
      () => this.runInternal(workflowDocument, inputs),
    );
  }

  private async runInternal(
    workflowDocument: WorkflowDocument,
    inputs: Record<string, unknown>,
  ): Promise<WorkflowRunResult> {
    const runId = `run_${Date.now().toString(36)}`;
    const traceId = `trace_${runId}`;
    const { workflow } = workflowDocument;
    const nodeById = new Map(workflow.nodes.map((node) => [node.id, node]));
    const order = topologicalSort(workflow.nodes, workflow.edges as BotFlowEdge[]);
    const variables: Record<string, unknown> = { ...inputs };
    const nodeExecutions: Record<string, NodeExecutionState> = {};
    let status: WorkflowRunResult['status'] = 'completed';

    for (const nodeId of order) {
      const node = nodeById.get(nodeId);
      if (!node) continue;
      const startedAt = now();
      const start = performance.now();
      nodeExecutions[nodeId] = { nodeId, status: 'running', startedAt };

      try {
        const aliases = buildUpstreamAliases(
          node,
          workflow.edges as BotFlowEdge[],
          nodeById,
          variables,
        );
        const output = await traceNodeExecution(
          {
            name: `node:${node.type}`,
            type: getLangfuseObservationType(node.type),
            input: getNodeTraceInput(node, variables, aliases),
            metadata: {
              runId,
              workflowId: workflow.id,
              workflowName: workflow.name,
              nodeId: node.id,
              nodeType: node.type,
              nodeLabel: node.label,
            },
          },
          () => this.executeNode(node, variables, aliases),
        );
        variables[node.id] = output;
        nodeExecutions[nodeId] = {
          nodeId,
          status: 'completed',
          startedAt,
          finishedAt: now(),
          durationMs: Math.round(performance.now() - start),
          output,
          usage:
            output && typeof output === 'object' && 'usage' in output
              ? (output.usage as NodeExecutionState['usage'])
              : undefined,
        };
      } catch (error) {
        status = 'failed';
        nodeExecutions[nodeId] = {
          nodeId,
          status: 'failed',
          startedAt,
          finishedAt: now(),
          durationMs: Math.round(performance.now() - start),
          error: {
            code: error instanceof Error ? error.message.split(':')[0] : 'NODE_EXECUTION_FAILED',
            message: error instanceof Error ? error.message : 'Node execution failed.',
          },
        };
        break;
      }
    }

    return {
      runId,
      traceId,
      status,
      outputs: { answer: variables.answer ?? variables[workflow.nodes.at(-1)?.id ?? ''] },
      nodeExecutions,
    };
  }

  private async executeNode(
    node: WorkflowNodeData,
    variables: Record<string, unknown>,
    aliases: Record<string, unknown>,
  ) {
    if (node.config.type === 'begin') return { ...variables };

    if (node.config.type === 'retrieval') {
      const config = node.config.data;
      const configuredVectorStoreId =
        config.vectorStoreId?.trim() || process.env.OPENAI_DEFAULT_VECTOR_STORE_ID?.trim();
      const kb = configuredVectorStoreId ? null : this.knowledgeBases.get(config.knowledgeBaseId);
      if (!configuredVectorStoreId && !kb)
        throw new Error(`KNOWLEDGE_BASE_NOT_FOUND: ${config.knowledgeBaseId}`);
      if (kb && kb.status !== 'ready')
        throw new Error(`KNOWLEDGE_BASE_NOT_READY: ${config.knowledgeBaseId}`);
      const vectorStoreId = configuredVectorStoreId || kb?.vectorStoreId;
      if (!vectorStoreId)
        throw new Error('VECTOR_STORE_SEARCH_FAILED: Vector Store ID is missing.');
      const query = resolveTemplate(config.queryTemplate, variables, aliases);
      const documents = await this.vectorStoreService.search({
        vectorStoreId,
        query,
        maxResults: config.maxResults,
        scoreThreshold: config.scoreThreshold,
      });
      return {
        query,
        knowledgeBaseId: kb?.id,
        vectorStoreId,
        documents,
        context: documents
          .map(
            (document, index) =>
              `[Internal Document ${index + 1}]\nSource: ${document.filename ?? document.fileId}\nContent:\n${document.content}`,
          )
          .join('\n\n'),
      };
    }

    if (node.config.type === 'web_search') {
      const config = node.config.data;
      const query = resolveTemplate(config.queryTemplate, variables, aliases);
      if (!query.trim()) throw new Error('WEB_SEARCH_EMPTY_QUERY');
      return this.webSearchService.search({
        model: config.modelId,
        query,
        maxSources: config.maxSources,
        allowedDomains: config.allowedDomains,
        userLocation: config.userLocation,
      });
    }

    if (node.config.type === 'llm') {
      const config = node.config.data;
      return this.llmService.generate({
        model: config.modelId,
        systemPrompt: config.systemPrompt,
        userPrompt: resolveTemplate(config.userPromptTemplate, variables, aliases),
        temperature: config.temperature,
        maxOutputTokens: config.maxOutputTokens,
      });
    }

    if (node.config.type === 'answer') {
      return { text: resolveTemplate(node.config.data.template, variables, aliases) };
    }

    return { output: resolvePath(variables, node.config.data.outputVariable, aliases) };
  }
}

const getLangfuseObservationType = (nodeType: NodeType) => {
  if (nodeType === 'retrieval') return 'retriever' as const;
  if (nodeType === 'web_search' || nodeType === 'llm') return 'generation' as const;
  return 'span' as const;
};

const getNodeTraceInput = (
  node: WorkflowNodeData,
  variables: Record<string, unknown>,
  aliases: Record<string, unknown>,
) => {
  if (node.config.type === 'begin') return variables;
  if (node.config.type === 'retrieval') {
    return {
      queryTemplate: node.config.data.queryTemplate,
      resolvedQuery: safeResolveTemplate(node.config.data.queryTemplate, variables, aliases),
      maxResults: node.config.data.maxResults,
      scoreThreshold: node.config.data.scoreThreshold,
      hasDirectVectorStoreId: Boolean(node.config.data.vectorStoreId),
      hasDefaultVectorStoreId: Boolean(process.env.OPENAI_DEFAULT_VECTOR_STORE_ID),
      knowledgeBaseId: node.config.data.knowledgeBaseId || undefined,
    };
  }
  if (node.config.type === 'web_search') {
    return {
      model: node.config.data.modelId,
      queryTemplate: node.config.data.queryTemplate,
      resolvedQuery: safeResolveTemplate(node.config.data.queryTemplate, variables, aliases),
      maxSources: node.config.data.maxSources,
      allowedDomains: node.config.data.allowedDomains,
    };
  }
  if (node.config.type === 'llm') {
    return {
      model: node.config.data.modelId,
      temperature: node.config.data.temperature,
      maxOutputTokens: node.config.data.maxOutputTokens,
      systemPrompt: node.config.data.systemPrompt,
      userPrompt: safeResolveTemplate(node.config.data.userPromptTemplate, variables, aliases),
    };
  }
  if (node.config.type === 'answer') {
    return { template: node.config.data.template };
  }
  return { outputVariable: node.config.data.outputVariable };
};

const safeResolveTemplate = (
  template: string,
  variables: Record<string, unknown>,
  aliases: Record<string, unknown>,
) => {
  try {
    return resolveTemplate(template, variables, aliases);
  } catch (error) {
    return error instanceof Error ? error.message : 'Template resolution failed.';
  }
};

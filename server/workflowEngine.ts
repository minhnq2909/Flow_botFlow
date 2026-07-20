import type {
  BotFlowEdge,
  NodeExecutionState,
  WorkflowDocument,
  WorkflowNodeData,
  WorkflowRunResult,
} from '../src/features/flow-builder/flow-builder.types';
import type { KnowledgeBase, LlmService, VectorStoreService, WebSearchService } from './types';

const now = () => new Date().toISOString();

const resolvePath = (source: Record<string, unknown>, path: string): unknown =>
  path.split('.').reduce<unknown>((current, key) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    throw new Error(`VARIABLE_NOT_FOUND: ${path}`);
  }, source);

export const resolveTemplate = (template: string, variables: Record<string, unknown>) =>
  template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, key: string) => {
    const value = resolvePath(variables, key.trim());
    return typeof value === 'string' ? value : JSON.stringify(value);
  });

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
        const output = await this.executeNode(node, variables);
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

  private async executeNode(node: WorkflowNodeData, variables: Record<string, unknown>) {
    if (node.config.type === 'begin') return variables;

    if (node.config.type === 'retrieval') {
      const config = node.config.data;
      const kb = this.knowledgeBases.get(config.knowledgeBaseId);
      if (!kb) throw new Error(`KNOWLEDGE_BASE_NOT_FOUND: ${config.knowledgeBaseId}`);
      if (kb.status !== 'ready')
        throw new Error(`KNOWLEDGE_BASE_NOT_READY: ${config.knowledgeBaseId}`);
      const query = resolveTemplate(config.queryTemplate, variables);
      const documents = await this.vectorStoreService.search({
        vectorStoreId: kb.vectorStoreId,
        query,
        maxResults: config.maxResults,
        scoreThreshold: config.scoreThreshold,
      });
      return {
        query,
        knowledgeBaseId: kb.id,
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
      const query = resolveTemplate(config.queryTemplate, variables);
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
        userPrompt: resolveTemplate(config.userPromptTemplate, variables),
        temperature: config.temperature,
        maxOutputTokens: config.maxOutputTokens,
      });
    }

    if (node.config.type === 'answer') {
      return { text: resolveTemplate(node.config.data.template, variables) };
    }

    return { output: resolvePath(variables, node.config.data.outputVariable) };
  }
}

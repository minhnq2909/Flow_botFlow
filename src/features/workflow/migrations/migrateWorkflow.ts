import type {
  BotFlowEdge,
  BotFlowNode,
  LlmNodeConfig,
  NodeConfig,
  NodeType,
  WorkflowDocument,
  WorkflowEdgeData,
  WorkflowNodeData,
} from '../../flow-builder/flow-builder.types';
import { NODE_LABELS, createDefaultConfig } from '../../flow-builder/flow-builder.constants';
import { slugify } from '../../flow-builder/flow-builder.utils';
import { LEGACY_NODE_TYPE_MAP } from './legacyNodeTypeMap';

type LegacyNode = BotFlowNode & {
  data: BotFlowNode['data'] & {
    botType: string;
    config: Record<string, unknown>;
  };
};

type StoredFlow = {
  flowName?: string;
  nodes?: LegacyNode[];
  edges?: BotFlowEdge[];
};

export type MigrationResult =
  | { ok: true; workflow: WorkflowDocument }
  | { ok: false; code: 'LEGACY_NODE_MIGRATION_FAILED'; message: string };

const nodeTypes: NodeType[] = ['begin', 'retrieval', 'web_search', 'llm', 'answer', 'end'];

const isNodeType = (value: string): value is NodeType => nodeTypes.includes(value as NodeType);

const migrateLegacyConfig = (type: NodeType, legacyConfig: Record<string, unknown>): NodeConfig => {
  const fallback = createDefaultConfig(type);

  if (type === 'answer' && typeof legacyConfig.content === 'string') {
    return { type, data: { template: legacyConfig.content || '{{llm-1.text}}' } };
  }

  if (type === 'llm') {
    const url = typeof legacyConfig.url === 'string' ? legacyConfig.url : '';
    const llmFallback = createDefaultConfig('llm').data as LlmNodeConfig;
    return {
      type,
      data: {
        ...llmFallback,
        systemPrompt: url ? `Legacy API Request URL: ${url}` : llmFallback.systemPrompt,
      },
    };
  }

  return fallback;
};

export const migrateStoredFlow = (stored: StoredFlow): MigrationResult => {
  const nodes = stored.nodes ?? [];
  const edges = stored.edges ?? [];
  const workflowNodes: WorkflowNodeData[] = [];

  for (const node of nodes) {
    const legacyType = String(node.data.botType ?? node.type);
    const type = isNodeType(legacyType) ? legacyType : LEGACY_NODE_TYPE_MAP[legacyType];

    if (!type) {
      return {
        ok: false,
        code: 'LEGACY_NODE_MIGRATION_FAILED',
        message: `Không thể migrate legacy node type "${legacyType}" ở node "${node.id}".`,
      };
    }

    const config =
      node.data.config?.type === type
        ? (node.data.config as NodeConfig)
        : migrateLegacyConfig(type, node.data.config ?? {});

    workflowNodes.push({
      id: node.id,
      type,
      label: NODE_LABELS[type],
      config,
    });
  }

  const workflowEdges: WorkflowEdgeData[] = edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
  }));

  const name = stored.flowName?.trim() || 'Customer Support Bot';

  return {
    ok: true,
    workflow: {
      schemaVersion: '1.0',
      workflow: {
        schemaVersion: '1.0',
        id: slugify(name),
        name,
        version: 1,
        nodes: workflowNodes,
        edges: workflowEdges,
      },
    },
  };
};

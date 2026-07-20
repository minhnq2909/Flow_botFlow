import type {
  BotFlowEdge,
  BotFlowNode,
  NodeType,
  WorkflowDocument,
} from '../../flow-builder/flow-builder.types';
import { NODE_LABELS } from '../../flow-builder/flow-builder.constants';
import { createId, slugify } from '../../flow-builder/flow-builder.utils';
import { migrateStoredFlow } from '../migrations/migrateWorkflow';

const nodeTypes: NodeType[] = ['begin', 'retrieval', 'web_search', 'llm', 'answer', 'end'];

const assertWorkflowDocument = (value: unknown): WorkflowDocument => {
  if (!value || typeof value !== 'object') {
    throw new Error('INVALID_WORKFLOW_SCHEMA: Workflow JSON phải là object.');
  }

  if ('workflow' in value && (value as WorkflowDocument).schemaVersion === '1.0') {
    return value as WorkflowDocument;
  }

  const migrated = migrateStoredFlow(value as Parameters<typeof migrateStoredFlow>[0]);
  if (!migrated.ok) {
    throw new Error(`${migrated.code}: ${migrated.message}`);
  }
  return migrated.workflow;
};

export const serializeWorkflowDocument = (
  flowName: string,
  nodes: BotFlowNode[],
  edges: BotFlowEdge[],
): WorkflowDocument => ({
  schemaVersion: '1.0',
  workflow: {
    schemaVersion: '1.0',
    id: slugify(flowName),
    name: flowName.trim(),
    version: 1,
    nodes: nodes.map((node) => ({
      id: node.id,
      type: node.data.botType,
      label: NODE_LABELS[node.data.botType],
      config: node.data.config,
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
    })),
  },
});

export const deserializeWorkflowDocument = (
  value: unknown,
): { flowName: string; nodes: BotFlowNode[]; edges: BotFlowEdge[] } => {
  const document = assertWorkflowDocument(value);
  const { workflow } = document;

  const nodes: BotFlowNode[] = workflow.nodes.map((node, index) => {
    if (!nodeTypes.includes(node.type)) {
      throw new Error(`UNKNOWN_NODE_TYPE: ${node.type}`);
    }
    if (node.type !== node.config.type) {
      throw new Error(`NODE_CONFIG_MISMATCH: ${node.id}`);
    }

    return {
      id: node.id,
      type: node.type,
      position: { x: 160 + index * 220, y: 160 },
      data: {
        label: node.label || NODE_LABELS[node.type],
        botType: node.type,
        config: node.config,
      },
    };
  });

  const edges: BotFlowEdge[] = workflow.edges.map((edge) => ({
    id: edge.id || createId('edge'),
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle ?? 'output',
    targetHandle: edge.targetHandle ?? 'input',
    type: 'smoothstep',
  }));

  return { flowName: workflow.name, nodes, edges };
};

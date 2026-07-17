import type { BotFlowEdge, BotFlowNode, BuiltFlowJson } from './flow-builder.types';
import { slugify } from './flow-builder.utils';

export const buildFlowJson = (
  flowName: string,
  nodes: BotFlowNode[],
  edges: BotFlowEdge[],
): BuiltFlowJson => {
  const startNode = nodes.find((node) => node.data.botType === 'start');

  return {
    version: '1.0',
    flow: {
      id: slugify(flowName),
      name: flowName.trim(),
      startNodeId: startNode?.id ?? '',
      nodes: nodes.map((node) => ({
        id: node.id,
        type: node.data.botType,
        config: node.data.config,
      })),
      connections: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        sourceHandle: edge.sourceHandle,
        target: edge.target,
        targetHandle: edge.targetHandle,
        ...(edge.label ? { label: String(edge.label) } : {}),
      })),
      editor: {
        nodes: nodes.map((node) => ({
          id: node.id,
          position: node.position,
          size:
            node.width || node.height
              ? {
                  width: node.width,
                  height: node.height,
                }
              : undefined,
        })),
      },
    },
  };
};

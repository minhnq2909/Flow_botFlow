import type { BotFlowEdge, BotFlowNode, BotNodeType } from './flow-builder.types';
import { createDefaultConfig } from './flow-builder.constants';

export const createId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'bot-flow';

export const createBotNode = (type: BotNodeType, position: { x: number; y: number }): BotFlowNode => {
  const config = createDefaultConfig(type);
  const idPrefix = type === 'api_request' ? 'api' : type;

  return {
    id: createId(idPrefix),
    type,
    position,
    data: {
      label: config.name,
      botType: type,
      config,
    },
  };
};

export const wouldCreateCycle = (
  edges: BotFlowEdge[],
  source: string,
  target: string,
): boolean => {
  const adjacency = new Map<string, string[]>();

  [...edges, { id: 'candidate', source, target }].forEach((edge) => {
    const nextTargets = adjacency.get(edge.source) ?? [];
    nextTargets.push(edge.target);
    adjacency.set(edge.source, nextTargets);
  });

  const visited = new Set<string>();
  const stack = [target];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    if (current === source) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    stack.push(...(adjacency.get(current) ?? []));
  }

  return false;
};

export const getOutgoingEdges = (edges: BotFlowEdge[], nodeId: string) =>
  edges.filter((edge) => edge.source === nodeId);

export const getIncomingEdges = (edges: BotFlowEdge[], nodeId: string) =>
  edges.filter((edge) => edge.target === nodeId);

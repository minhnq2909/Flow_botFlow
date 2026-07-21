import type { BotFlowEdge, BotFlowNode, ValidationError } from './flow-builder.types';
import { getOutgoingEdges, wouldCreateCycle } from './flow-builder.utils';

const canReach = (startIds: string[], edges: BotFlowEdge[]) => {
  const visited = new Set<string>();
  const stack = [...startIds];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || visited.has(current)) continue;
    visited.add(current);
    edges.filter((edge) => edge.source === current).forEach((edge) => stack.push(edge.target));
  }

  return visited;
};

export const validateFlow = (
  flowName: string,
  nodes: BotFlowNode[],
  edges: BotFlowEdge[],
): ValidationError[] => {
  const errors: ValidationError[] = [];
  const nodeIds = new Set(nodes.map((node) => node.id));
  const edgeIds = new Set<string>();
  const beginNodes = nodes.filter((node) => node.data.botType === 'begin');
  const endNodes = nodes.filter((node) => node.data.botType === 'end');

  if (!flowName.trim()) {
    errors.push({ code: 'INVALID_WORKFLOW_SCHEMA', message: 'Workflow phải có tên.' });
  }

  if (beginNodes.length !== 1) {
    errors.push({
      code: 'BEGIN_NODE_MISSING',
      message: `Workflow phải có đúng một Begin node, hiện có ${beginNodes.length}.`,
    });
  }

  if (endNodes.length < 1) {
    errors.push({ code: 'END_NODE_MISSING', message: 'Workflow phải có ít nhất một End node.' });
  }

  nodes.forEach((node) => {
    if (node.data.botType !== node.data.config.type) {
      errors.push({
        code: 'NODE_CONFIG_MISMATCH',
        message: `Node "${node.id}" có type và config.type không khớp.`,
        nodeId: node.id,
      });
    }

    if (node.data.config.type === 'retrieval') {
      const config = node.data.config.data;
      if (!config.queryTemplate.trim()) {
        errors.push({
          code: 'VARIABLE_NOT_FOUND',
          message: `Knowledge Retrieval node "${node.id}" chưa có query template.`,
          nodeId: node.id,
        });
      }
    }

    if (node.data.config.type === 'web_search') {
      const config = node.data.config.data;
      if (!config.queryTemplate.trim()) {
        errors.push({
          code: 'WEB_SEARCH_EMPTY_QUERY',
          message: `Web Search node "${node.id}" chưa có query template.`,
          nodeId: node.id,
        });
      }
    }

    if (node.data.config.type === 'llm') {
      const config = node.data.config.data;
      if (!config.modelId.trim() || !config.userPromptTemplate.trim()) {
        errors.push({
          code: 'LLM_PROVIDER_FAILED',
          message: `LLM node "${node.id}" thiếu model hoặc user prompt template.`,
          nodeId: node.id,
        });
      }
    }
  });

  edges.forEach((edge) => {
    if (edgeIds.has(edge.id)) {
      errors.push({ code: 'DUPLICATE_NODE_ID', message: `Edge id "${edge.id}" bị trùng.` });
    }
    edgeIds.add(edge.id);

    if (edge.source === edge.target) {
      errors.push({
        code: 'INVALID_EDGE',
        message: `Edge "${edge.id}" đang tự nối node với chính nó.`,
        edgeId: edge.id,
      });
    }
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      errors.push({
        code: 'INVALID_EDGE',
        message: `Edge "${edge.id}" tham chiếu tới node không tồn tại.`,
        edgeId: edge.id,
      });
    }
    if (
      wouldCreateCycle(
        edges.filter((candidate) => candidate.id !== edge.id),
        edge.source,
        edge.target,
      )
    ) {
      errors.push({
        code: 'CYCLE_DETECTED',
        message: `Edge "${edge.id}" tạo cycle.`,
        edgeId: edge.id,
      });
    }
  });

  beginNodes.forEach((node) => {
    if (getOutgoingEdges(edges, node.id).length === 0) {
      errors.push({
        code: 'INVALID_EDGE',
        message: `Begin node "${node.id}" chưa nối tới node khác.`,
        nodeId: node.id,
      });
    }
  });

  if (beginNodes.length === 1) {
    const reachableFromBegin = canReach([beginNodes[0].id], edges);
    nodes.forEach((node) => {
      if (!reachableFromBegin.has(node.id)) {
        errors.push({
          code: 'UNREACHABLE_NODE',
          message: `Node "${node.id}" không thể đi tới từ Begin.`,
          nodeId: node.id,
        });
      }
    });
  }

  return errors;
};

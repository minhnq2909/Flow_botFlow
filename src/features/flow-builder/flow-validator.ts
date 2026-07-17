import type {
  ApiRequestNodeConfig,
  BotFlowEdge,
  BotFlowNode,
  ConditionNodeConfig,
  MessageNodeConfig,
  ValidationError,
} from './flow-builder.types';
import { getOutgoingEdges } from './flow-builder.utils';

const isValidUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return Boolean(parsed.protocol && parsed.host);
  } catch {
    return false;
  }
};

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
  const startNodes = nodes.filter((node) => node.data.botType === 'start');
  const endNodes = nodes.filter((node) => node.data.botType === 'end');

  if (!flowName.trim()) {
    errors.push({ code: 'FLOW_NAME_REQUIRED', message: 'Flow phải có tên.' });
  }

  if (startNodes.length !== 1) {
    errors.push({
      code: 'START_COUNT_INVALID',
      message: `Flow phải có đúng một Start node, hiện có ${startNodes.length}.`,
    });
  }

  if (endNodes.length < 1) {
    errors.push({ code: 'END_REQUIRED', message: 'Flow phải có ít nhất một End node.' });
  }

  edges.forEach((edge) => {
    if (edge.source === edge.target) {
      errors.push({
        code: 'SELF_CONNECTION',
        message: `Edge "${edge.id}" đang tự nối node với chính nó.`,
        edgeId: edge.id,
      });
    }
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      errors.push({
        code: 'EDGE_NODE_MISSING',
        message: `Edge "${edge.id}" tham chiếu tới node không tồn tại.`,
        edgeId: edge.id,
      });
    }
  });

  nodes.forEach((node) => {
    const name = node.data.config.name;
    const outgoing = getOutgoingEdges(edges, node.id);

    if (node.data.botType === 'start' && outgoing.length === 0) {
      errors.push({
        code: 'START_NOT_CONNECTED',
        message: `Start node "${name}" chưa nối tới node khác.`,
        nodeId: node.id,
      });
    }

    if (node.data.botType === 'message') {
      const config = node.data.config as MessageNodeConfig;
      if (!config.content.trim()) {
        errors.push({
          code: 'MESSAGE_CONTENT_REQUIRED',
          message: `Message node "${name}" chưa có nội dung.`,
          nodeId: node.id,
        });
      }
    }

    if (node.data.botType === 'condition') {
      const config = node.data.config as ConditionNodeConfig;
      if (!config.variable.trim() || !config.operator || !config.value.trim()) {
        errors.push({
          code: 'CONDITION_CONFIG_REQUIRED',
          message: `Condition node "${name}" chưa đủ variable, operator và value.`,
          nodeId: node.id,
        });
      }
      if (!outgoing.some((edge) => edge.sourceHandle === 'true')) {
        errors.push({
          code: 'CONDITION_TRUE_REQUIRED',
          message: `Condition node "${name}" chưa có nhánh True.`,
          nodeId: node.id,
        });
      }
      if (!outgoing.some((edge) => edge.sourceHandle === 'false')) {
        errors.push({
          code: 'CONDITION_FALSE_REQUIRED',
          message: `Condition node "${name}" chưa có nhánh False.`,
          nodeId: node.id,
        });
      }
    }

    if (node.data.botType === 'api_request') {
      const config = node.data.config as ApiRequestNodeConfig;
      if (!config.url.trim() || !isValidUrl(config.url)) {
        errors.push({
          code: 'API_URL_INVALID',
          message: `API Request node "${name}" chưa có URL hợp lệ.`,
          nodeId: node.id,
        });
      }
      if (['POST', 'PUT', 'PATCH'].includes(config.method) && config.body.trim()) {
        try {
          JSON.parse(config.body);
        } catch {
          errors.push({
            code: 'API_BODY_INVALID_JSON',
            message: `API Request node "${name}" có request body không phải JSON hợp lệ.`,
            nodeId: node.id,
          });
        }
      }
    }
  });

  if (startNodes.length === 1) {
    const reachableFromStart = canReach([startNodes[0].id], edges);
    nodes.forEach((node) => {
      if (!reachableFromStart.has(node.id)) {
        errors.push({
          code: 'NODE_UNREACHABLE_FROM_START',
          message: `Node "${node.data.config.name}" không thể đi tới từ Start.`,
          nodeId: node.id,
        });
      }
    });

    const reversedEdges = edges.map((edge) => ({
      ...edge,
      source: edge.target,
      target: edge.source,
    }));
    const canLeadToEnd = canReach(
      endNodes.map((node) => node.id),
      reversedEdges,
    );
    nodes.forEach((node) => {
      if (!canLeadToEnd.has(node.id)) {
        errors.push({
          code: 'NODE_CANNOT_REACH_END',
          message: `Node "${node.data.config.name}" không thể dẫn tới End node.`,
          nodeId: node.id,
        });
      }
    });
  }

  return errors;
};

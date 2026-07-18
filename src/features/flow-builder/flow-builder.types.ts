import type { Edge, Node } from '@xyflow/react';

export type BotNodeType = 'start' | 'message' | 'condition' | 'api_request' | 'end';

export type ConditionOperator = 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type StartNodeConfig = {
  name: string;
};

export type MessageNodeConfig = {
  name: string;
  content: string;
};

export type ConditionNodeConfig = {
  name: string;
  variable: string;
  operator: ConditionOperator;
  value: string;
};

export type ApiRequestNodeConfig = {
  name: string;
  method: HttpMethod;
  url: string;
  body: string;
  responseVariable: string;
};

export type EndNodeConfig = {
  name: string;
};

export type BotNodeConfig =
  StartNodeConfig | MessageNodeConfig | ConditionNodeConfig | ApiRequestNodeConfig | EndNodeConfig;

export type BotNodeData = {
  label: string;
  botType: BotNodeType;
  config: BotNodeConfig;
};

export type BotFlowNode = Node<BotNodeData, BotNodeType>;
export type BotFlowEdge = Edge;

export type FlowBuilderState = {
  flowId: string;
  flowName: string;
  nodes: BotFlowNode[];
  edges: BotFlowEdge[];
  selectedNodeId: string | null;
};

export type ValidationError = {
  code: string;
  message: string;
  nodeId?: string;
  edgeId?: string;
};

export type BuiltFlowJson = {
  version: '1.0';
  flow: {
    id: string;
    name: string;
    startNodeId: string;
    nodes: Array<{
      id: string;
      type: BotNodeType;
      config: BotNodeConfig;
    }>;
    connections: Array<{
      id: string;
      source: string;
      sourceHandle?: string | null;
      target: string;
      targetHandle?: string | null;
      label?: string;
    }>;
    editor: {
      nodes: Array<{
        id: string;
        position: {
          x: number;
          y: number;
        };
        size?: {
          width?: number;
          height?: number;
        };
      }>;
    };
  };
};

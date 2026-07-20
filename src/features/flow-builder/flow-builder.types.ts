import type { Edge, Node } from '@xyflow/react';

export type NodeType = 'begin' | 'retrieval' | 'web_search' | 'llm' | 'answer' | 'end';
export type BotNodeType = NodeType;

export type WorkflowValueType = 'string' | 'number' | 'boolean' | 'object' | 'array';

export type BeginVariable = {
  name: string;
  dataType: WorkflowValueType;
  required: boolean;
  defaultValue?: unknown;
};

export type BeginNodeConfig = {
  variables: BeginVariable[];
};

export type RetrievalNodeConfig = {
  provider: 'openai_vector_store';
  knowledgeBaseId: string;
  queryTemplate: string;
  maxResults: number;
  scoreThreshold?: number;
};

export type WebSearchNodeConfig = {
  provider: 'openai';
  modelId: string;
  queryTemplate: string;
  maxSources?: number;
  allowedDomains?: string[];
  userLocation?: {
    country?: string;
    city?: string;
    region?: string;
    timezone?: string;
  };
};

export type LlmNodeConfig = {
  provider: 'openai';
  modelId: string;
  systemPrompt: string;
  userPromptTemplate: string;
  temperature: number;
  maxOutputTokens?: number;
};

export type AnswerNodeConfig = {
  template: string;
};

export type EndNodeConfig = {
  outputVariable: string;
};

export type NodeConfig =
  | { type: 'begin'; data: BeginNodeConfig }
  | { type: 'retrieval'; data: RetrievalNodeConfig }
  | { type: 'web_search'; data: WebSearchNodeConfig }
  | { type: 'llm'; data: LlmNodeConfig }
  | { type: 'answer'; data: AnswerNodeConfig }
  | { type: 'end'; data: EndNodeConfig };

export type BotNodeConfig = NodeConfig;

export type WorkflowNodeData = {
  id: string;
  type: NodeType;
  label: string;
  config: NodeConfig;
};

export type BotNodeData = {
  label: string;
  botType: NodeType;
  config: NodeConfig;
  execution?: NodeExecutionState;
};

export type BotFlowNode = Node<BotNodeData, NodeType>;
export type BotFlowEdge = Edge;

export type WorkflowEdgeData = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
};

export type WorkflowDefinition = {
  schemaVersion: '1.0';
  id: string;
  name: string;
  version: number;
  nodes: WorkflowNodeData[];
  edges: WorkflowEdgeData[];
};

export type WorkflowDocument = {
  schemaVersion: '1.0';
  workflow: WorkflowDefinition;
};

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

export type NodeExecutionStatus =
  'idle' | 'queued' | 'running' | 'completed' | 'failed' | 'skipped';

export type NodeExecutionState = {
  nodeId: string;
  status: NodeExecutionStatus;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  input?: unknown;
  output?: unknown;
  error?: {
    code?: string;
    message: string;
  };
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    totalCost?: number;
    currency?: string;
  };
};

export type WorkflowRunResult = {
  runId: string;
  traceId?: string;
  status: 'completed' | 'failed';
  outputs: Record<string, unknown>;
  nodeExecutions: Record<string, NodeExecutionState>;
};

export type BuiltFlowJson = WorkflowDocument;

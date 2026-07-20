import type {
  WorkflowDocument,
  WorkflowRunResult,
} from '../src/features/flow-builder/flow-builder.types';

export type KnowledgeBase = {
  id: string;
  name: string;
  description?: string;
  provider: 'openai';
  vectorStoreId: string;
  status: 'creating' | 'processing' | 'ready' | 'failed';
  createdAt: string;
  updatedAt: string;
};

export type RetrievedDocument = {
  id: string;
  fileId: string;
  filename?: string;
  content: string;
  score?: number;
  attributes?: Record<string, unknown>;
};

export type WebSearchSource = {
  url: string;
  title?: string;
  domain?: string;
};

export type WebSearchResult = {
  provider: 'openai';
  responseId: string;
  model: string;
  query: string;
  summary: string;
  context: string;
  sources: WebSearchSource[];
  citations: Array<{ url: string; title?: string; startIndex?: number; endIndex?: number }>;
  searchActions?: Array<{ type: string; query?: string; url?: string }>;
  usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number };
};

export type LlmGenerateRequest = {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
  maxOutputTokens?: number;
};

export type LlmGenerateResult = {
  provider: 'openai';
  responseId: string;
  model: string;
  text: string;
  finishReason?: string;
  usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number };
};

export interface VectorStoreService {
  create(params: { name: string }): Promise<{ vectorStoreId: string; status: string }>;
  addFile(params: { vectorStoreId: string; fileId: string }): Promise<void>;
  search(params: {
    vectorStoreId: string;
    query: string;
    maxResults: number;
    scoreThreshold?: number;
  }): Promise<RetrievedDocument[]>;
  delete(vectorStoreId: string): Promise<void>;
}

export interface WebSearchService {
  search(params: {
    model: string;
    query: string;
    maxSources?: number;
    allowedDomains?: string[];
    userLocation?: { country?: string; city?: string; region?: string; timezone?: string };
  }): Promise<WebSearchResult>;
}

export interface LlmService {
  generate(request: LlmGenerateRequest): Promise<LlmGenerateResult>;
}

export type WorkflowRunRequest = {
  workflow: WorkflowDocument;
  inputs: Record<string, unknown>;
};

export type { WorkflowRunResult };

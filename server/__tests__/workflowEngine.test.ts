import { describe, expect, it } from 'vitest';
import { WorkflowEngine, resolveTemplate } from '../workflowEngine';
import type { KnowledgeBase, LlmService, VectorStoreService, WebSearchService } from '../types';
import type { WorkflowDocument } from '../../src/features/flow-builder/flow-builder.types';

const workflow: WorkflowDocument = {
  schemaVersion: '1.0',
  workflow: {
    schemaVersion: '1.0',
    id: 'hybrid',
    name: 'Hybrid',
    version: 1,
    nodes: [
      {
        id: 'begin-1',
        type: 'begin',
        label: 'Begin',
        config: {
          type: 'begin',
          data: { variables: [{ name: 'query', dataType: 'string', required: true }] },
        },
      },
      {
        id: 'retrieval-1',
        type: 'retrieval',
        label: 'Knowledge Retrieval',
        config: {
          type: 'retrieval',
          data: {
            provider: 'openai_vector_store',
            knowledgeBaseId: '',
            vectorStoreId: 'vs_1',
            queryTemplate: '{{query}}',
            maxResults: 3,
          },
        },
      },
      {
        id: 'web-search-1',
        type: 'web_search',
        label: 'Web Search',
        config: {
          type: 'web_search',
          data: { provider: 'openai', modelId: 'mock-web', queryTemplate: '{{query}}' },
        },
      },
      {
        id: 'llm-1',
        type: 'llm',
        label: 'LLM',
        config: {
          type: 'llm',
          data: {
            provider: 'openai',
            modelId: 'mock-llm',
            systemPrompt: 'system',
            userPromptTemplate: '{{retrieval.context}}\n{{web_search.context}}',
            temperature: 0.2,
          },
        },
      },
      {
        id: 'answer-1',
        type: 'answer',
        label: 'Answer',
        config: { type: 'answer', data: { template: '{{llm.text}}' } },
      },
      {
        id: 'end-1',
        type: 'end',
        label: 'End',
        config: { type: 'end', data: { outputVariable: 'answer.text' } },
      },
    ],
    edges: [
      { id: 'e1', source: 'begin-1', target: 'retrieval-1' },
      { id: 'e2', source: 'begin-1', target: 'web-search-1' },
      { id: 'e3', source: 'retrieval-1', target: 'llm-1' },
      { id: 'e4', source: 'web-search-1', target: 'llm-1' },
      { id: 'e5', source: 'llm-1', target: 'answer-1' },
      { id: 'e6', source: 'answer-1', target: 'end-1' },
    ],
  },
};

describe('WorkflowEngine', () => {
  it('resolves templates without eval', () => {
    expect(resolveTemplate('Hello {{input.name}}', { input: { name: 'Minh' } })).toBe('Hello Minh');
  });

  it('passes retrieval and web outputs into the LLM node', async () => {
    const knowledgeBases = new Map<string, KnowledgeBase>();
    const vectorStoreService: VectorStoreService = {
      create: async () => ({ vectorStoreId: 'vs_1', status: 'ready' }),
      addFile: async () => undefined,
      delete: async () => undefined,
      search: async () => [{ id: 'doc_1', fileId: 'file_1', content: 'internal context' }],
    };
    const webSearchService: WebSearchService = {
      search: async () => ({
        provider: 'openai',
        responseId: 'resp_web',
        model: 'mock-web',
        query: 'q',
        summary: 'web',
        context: 'web context',
        sources: [],
        citations: [],
      }),
    };
    const llmService: LlmService = {
      generate: async (request) => ({
        provider: 'openai',
        responseId: 'resp_llm',
        model: request.model,
        text: request.userPrompt,
      }),
    };

    const result = await new WorkflowEngine(
      knowledgeBases,
      vectorStoreService,
      webSearchService,
      llmService,
    ).run(workflow, { query: 'q' });

    expect(result.status).toBe('completed');
    expect(result.nodeExecutions['llm-1'].output).toMatchObject({
      text: expect.stringContaining('internal context'),
    });
    expect(JSON.stringify(result.nodeExecutions['llm-1'].output)).toContain('web context');
  });
});

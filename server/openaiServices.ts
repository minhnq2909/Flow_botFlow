import OpenAI from 'openai';
import type {
  LlmGenerateRequest,
  LlmGenerateResult,
  RetrievedDocument,
  VectorStoreService,
  WebSearchResult,
  WebSearchService,
  LlmService,
} from './types';

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const requireClient = () => {
  if (!client) throw new Error('OPENAI_API_KEY is not configured.');
  return client;
};

export class OpenAiVectorStoreService implements VectorStoreService {
  async create(params: { name: string }) {
    const vectorStore = await requireClient().vectorStores.create({ name: params.name });
    return { vectorStoreId: vectorStore.id, status: 'ready' };
  }

  async addFile(params: { vectorStoreId: string; fileId: string }) {
    await requireClient().vectorStores.files.create(params.vectorStoreId, {
      file_id: params.fileId,
    });
  }

  async search(params: {
    vectorStoreId: string;
    query: string;
    maxResults: number;
    scoreThreshold?: number;
  }): Promise<RetrievedDocument[]> {
    const response = await requireClient().vectorStores.search(params.vectorStoreId, {
      query: params.query,
      max_num_results: params.maxResults,
      ranking_options:
        params.scoreThreshold === undefined
          ? undefined
          : { score_threshold: params.scoreThreshold },
    });

    return response.data.map((result, index) => ({
      id: `${result.file_id}-${index}`,
      fileId: result.file_id,
      filename: result.filename ?? undefined,
      score: result.score,
      attributes:
        result.attributes && typeof result.attributes === 'object'
          ? (result.attributes as Record<string, unknown>)
          : undefined,
      content: result.content
        .filter((part) => part.type === 'text' && 'text' in part)
        .map((part) => part.text)
        .join('\n'),
    }));
  }

  async delete(vectorStoreId: string) {
    await requireClient().vectorStores.delete(vectorStoreId);
  }
}

export class OpenAiWebSearchService implements WebSearchService {
  async search(params: {
    model: string;
    query: string;
    maxSources?: number;
    allowedDomains?: string[];
  }): Promise<WebSearchResult> {
    const response = await requireClient().responses.create({
      model: params.model,
      input: params.query,
      tools: [{ type: 'web_search_preview' }],
    });
    const text = response.output_text ?? '';

    return {
      provider: 'openai',
      responseId: response.id,
      model: params.model,
      query: params.query,
      summary: text,
      context: text,
      sources: [],
      citations: [],
      searchActions: [],
      usage: {
        inputTokens: response.usage?.input_tokens,
        outputTokens: response.usage?.output_tokens,
        totalTokens: response.usage?.total_tokens,
      },
    };
  }
}

export class OpenAiLlmService implements LlmService {
  async generate(request: LlmGenerateRequest): Promise<LlmGenerateResult> {
    const response = await requireClient().responses.create({
      model: request.model,
      input: [
        { role: 'system', content: request.systemPrompt },
        { role: 'user', content: request.userPrompt },
      ],
      temperature: request.temperature,
      max_output_tokens: request.maxOutputTokens,
    });

    return {
      provider: 'openai',
      responseId: response.id,
      model: request.model,
      text: response.output_text ?? '',
      usage: {
        inputTokens: response.usage?.input_tokens,
        outputTokens: response.usage?.output_tokens,
        totalTokens: response.usage?.total_tokens,
      },
    };
  }
}

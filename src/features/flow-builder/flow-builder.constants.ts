import { BookOpenText, BrainCircuit, FileText, Globe2, Octagon, Play } from 'lucide-react';
import type { BotNodeConfig, NodeType } from './flow-builder.types';

export const NODE_LABELS: Record<NodeType, string> = {
  begin: 'Begin',
  retrieval: 'Knowledge Retrieval',
  web_search: 'Web Search',
  llm: 'LLM',
  answer: 'Answer',
  end: 'End',
};

export const NODE_COLORS: Record<NodeType, string> = {
  begin: '#16a34a',
  retrieval: '#2563eb',
  web_search: '#0891b2',
  llm: '#7c3aed',
  answer: '#d97706',
  end: '#dc2626',
};

export const NODE_PALETTE = [
  {
    type: 'begin',
    name: NODE_LABELS.begin,
    description: 'Declare workflow inputs.',
    icon: Play,
    colorClass: 'text-green-700 bg-green-50 border-green-200',
  },
  {
    type: 'retrieval',
    name: NODE_LABELS.retrieval,
    description: 'Search an OpenAI Vector Store.',
    icon: BookOpenText,
    colorClass: 'text-blue-700 bg-blue-50 border-blue-200',
  },
  {
    type: 'web_search',
    name: NODE_LABELS.web_search,
    description: 'Search the web with OpenAI.',
    icon: Globe2,
    colorClass: 'text-cyan-700 bg-cyan-50 border-cyan-200',
  },
  {
    type: 'llm',
    name: NODE_LABELS.llm,
    description: 'Generate text with the Responses API.',
    icon: BrainCircuit,
    colorClass: 'text-violet-700 bg-violet-50 border-violet-200',
  },
  {
    type: 'answer',
    name: NODE_LABELS.answer,
    description: 'Render a final answer template.',
    icon: FileText,
    colorClass: 'text-amber-700 bg-amber-50 border-amber-200',
  },
  {
    type: 'end',
    name: NODE_LABELS.end,
    description: 'Select the workflow output.',
    icon: Octagon,
    colorClass: 'text-red-700 bg-red-50 border-red-200',
  },
] as const satisfies Array<{
  type: NodeType;
  name: string;
  description: string;
  icon: typeof Play;
  colorClass: string;
}>;

export const WORKFLOW_VALUE_TYPES = ['string', 'number', 'boolean', 'object', 'array'] as const;

export const DEFAULT_OPENAI_MODEL = 'gpt-4.1-mini';
export const DEFAULT_WEB_SEARCH_MODEL = 'gpt-4.1-mini';

export const createDefaultConfig = (type: NodeType): BotNodeConfig => {
  const configs: Record<NodeType, BotNodeConfig> = {
    begin: {
      type: 'begin',
      data: {
        variables: [{ name: 'query', dataType: 'string', required: true }],
      },
    },
    retrieval: {
      type: 'retrieval',
      data: {
        provider: 'openai_vector_store',
        knowledgeBaseId: '',
        queryTemplate: '{{query}}',
        maxResults: 5,
        scoreThreshold: 0.4,
      },
    },
    web_search: {
      type: 'web_search',
      data: {
        provider: 'openai',
        modelId: DEFAULT_WEB_SEARCH_MODEL,
        queryTemplate: '{{query}}',
        maxSources: 8,
        allowedDomains: [],
        userLocation: { country: 'VN', city: 'Hanoi', timezone: 'Asia/Bangkok' },
      },
    },
    llm: {
      type: 'llm',
      data: {
        provider: 'openai',
        modelId: DEFAULT_OPENAI_MODEL,
        systemPrompt:
          'Use the supplied context. Preserve source attribution and do not invent sources.',
        userPromptTemplate:
          'Question:\n{{query}}\n\nContext:\n{{retrieval-1.context}}\n{{web-search-1.context}}',
        temperature: 0.2,
        maxOutputTokens: 700,
      },
    },
    answer: {
      type: 'answer',
      data: {
        template: '{{llm-1.text}}',
      },
    },
    end: {
      type: 'end',
      data: {
        outputVariable: 'answer-1.text',
      },
    },
  };

  return configs[type];
};

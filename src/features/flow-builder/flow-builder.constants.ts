import { GitBranch, MessageSquareText, Octagon, Play, RadioTower } from 'lucide-react';
import type {
  ApiRequestNodeConfig,
  BotNodeConfig,
  BotNodeType,
  ConditionNodeConfig,
  ConditionOperator,
  EndNodeConfig,
  HttpMethod,
  MessageNodeConfig,
  StartNodeConfig,
} from './flow-builder.types';

export const NODE_COLORS: Record<BotNodeType, string> = {
  start: '#16a34a',
  message: '#2563eb',
  condition: '#d97706',
  api_request: '#7c3aed',
  end: '#dc2626',
};

export const NODE_PALETTE = [
  {
    type: 'start',
    name: 'Start',
    description: 'Entry point for the chatbot flow.',
    icon: Play,
    colorClass: 'text-green-700 bg-green-50 border-green-200',
  },
  {
    type: 'message',
    name: 'Message',
    description: 'Send a bot message with optional variables.',
    icon: MessageSquareText,
    colorClass: 'text-blue-700 bg-blue-50 border-blue-200',
  },
  {
    type: 'condition',
    name: 'Condition',
    description: 'Branch the flow using true and false paths.',
    icon: GitBranch,
    colorClass: 'text-amber-700 bg-amber-50 border-amber-200',
  },
  {
    type: 'api_request',
    name: 'API Request',
    description: 'Describe an API call and store its response.',
    icon: RadioTower,
    colorClass: 'text-violet-700 bg-violet-50 border-violet-200',
  },
  {
    type: 'end',
    name: 'End',
    description: 'Terminate a branch of the conversation.',
    icon: Octagon,
    colorClass: 'text-red-700 bg-red-50 border-red-200',
  },
] as const satisfies Array<{
  type: BotNodeType;
  name: string;
  description: string;
  icon: typeof Play;
  colorClass: string;
}>;

export const CONDITION_OPERATORS: ConditionOperator[] = [
  'equals',
  'not_equals',
  'contains',
  'greater_than',
  'less_than',
];

export const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

export const createDefaultConfig = (type: BotNodeType): BotNodeConfig => {
  const configs: Record<BotNodeType, BotNodeConfig> = {
    start: { name: 'Start' } satisfies StartNodeConfig,
    message: { name: 'Message', content: '' } satisfies MessageNodeConfig,
    condition: {
      name: 'Condition',
      variable: '',
      operator: 'equals',
      value: '',
    } satisfies ConditionNodeConfig,
    api_request: {
      name: 'API Request',
      method: 'GET',
      url: '',
      body: '',
      responseVariable: '',
    } satisfies ApiRequestNodeConfig,
    end: { name: 'End' } satisfies EndNodeConfig,
  };

  return configs[type];
};

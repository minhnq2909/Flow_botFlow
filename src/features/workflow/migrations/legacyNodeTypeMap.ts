import type { NodeType } from '../../flow-builder/flow-builder.types';

export const LEGACY_NODE_TYPE_MAP: Record<string, NodeType> = {
  start: 'begin',
  message: 'answer',
  api_request: 'llm',
  end: 'end',
};

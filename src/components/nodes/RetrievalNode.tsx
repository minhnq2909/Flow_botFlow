import type { NodeProps } from '@xyflow/react';
import type {
  BotFlowNode,
  RetrievalNodeConfig,
} from '../../features/flow-builder/flow-builder.types';
import { BaseNode } from './BaseNode';

export const RetrievalNode = (props: NodeProps<BotFlowNode>) => {
  const config = props.data.config.data as RetrievalNodeConfig;

  return (
    <BaseNode {...props}>
      <p className="font-semibold text-blue-700">{config.maxResults} results</p>
      <p className="line-clamp-2">{config.knowledgeBaseId || 'No knowledge base selected.'}</p>
    </BaseNode>
  );
};

import type { NodeProps } from '@xyflow/react';
import type { BotFlowNode, MessageNodeConfig } from '../../features/flow-builder/flow-builder.types';
import { BaseNode } from './BaseNode';

export const MessageNode = (props: NodeProps<BotFlowNode>) => {
  const config = props.data.config as MessageNodeConfig;

  return (
    <BaseNode {...props}>
      <p className="line-clamp-3">{config.content || 'No message content yet.'}</p>
    </BaseNode>
  );
};

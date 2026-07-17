import type { NodeProps } from '@xyflow/react';
import type { BotFlowNode } from '../../features/flow-builder/flow-builder.types';
import { BaseNode } from './BaseNode';

export const StartNode = (props: NodeProps<BotFlowNode>) => (
  <BaseNode {...props} showInput={false}>
    Ready to begin the conversation.
  </BaseNode>
);

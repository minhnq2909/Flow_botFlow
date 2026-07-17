import type { NodeProps } from '@xyflow/react';
import type { BotFlowNode } from '../../features/flow-builder/flow-builder.types';
import { BaseNode } from './BaseNode';

export const EndNode = (props: NodeProps<BotFlowNode>) => (
  <BaseNode {...props} showOutput={false}>
    This branch stops here.
  </BaseNode>
);

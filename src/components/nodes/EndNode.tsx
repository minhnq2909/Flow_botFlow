import type { NodeProps } from '@xyflow/react';
import type { BotFlowNode, EndNodeConfig } from '../../features/flow-builder/flow-builder.types';
import { BaseNode } from './BaseNode';

export const EndNode = (props: NodeProps<BotFlowNode>) => {
  const config = props.data.config.data as EndNodeConfig;

  return (
    <BaseNode {...props} showOutput={false}>
      <p>{config.outputVariable || 'No output variable.'}</p>
    </BaseNode>
  );
};

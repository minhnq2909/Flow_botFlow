import type { NodeProps } from '@xyflow/react';
import type { BeginNodeConfig, BotFlowNode } from '../../features/flow-builder/flow-builder.types';
import { BaseNode } from './BaseNode';

export const BeginNode = (props: NodeProps<BotFlowNode>) => {
  const config = props.data.config.data as BeginNodeConfig;

  return (
    <BaseNode {...props} showInput={false}>
      <p>{config.variables.length} input variable(s)</p>
    </BaseNode>
  );
};

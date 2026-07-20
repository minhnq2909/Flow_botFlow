import type { NodeProps } from '@xyflow/react';
import type { BotFlowNode, LlmNodeConfig } from '../../features/flow-builder/flow-builder.types';
import { BaseNode } from './BaseNode';

export const LlmNode = (props: NodeProps<BotFlowNode>) => {
  const config = props.data.config.data as LlmNodeConfig;

  return (
    <BaseNode {...props}>
      <p className="font-semibold text-violet-700">{config.modelId}</p>
      <p>Temperature {config.temperature}</p>
    </BaseNode>
  );
};

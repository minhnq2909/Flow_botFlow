import type { NodeProps } from '@xyflow/react';
import type { ApiRequestNodeConfig, BotFlowNode } from '../../features/flow-builder/flow-builder.types';
import { BaseNode } from './BaseNode';

export const ApiRequestNode = (props: NodeProps<BotFlowNode>) => {
  const config = props.data.config as ApiRequestNodeConfig;

  return (
    <BaseNode {...props}>
      <p className="font-semibold text-violet-700">{config.method}</p>
      <p className="line-clamp-2">{config.url || 'No URL configured.'}</p>
    </BaseNode>
  );
};

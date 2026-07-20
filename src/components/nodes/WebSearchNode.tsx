import type { NodeProps } from '@xyflow/react';
import type {
  BotFlowNode,
  WebSearchNodeConfig,
} from '../../features/flow-builder/flow-builder.types';
import { BaseNode } from './BaseNode';

export const WebSearchNode = (props: NodeProps<BotFlowNode>) => {
  const config = props.data.config.data as WebSearchNodeConfig;

  return (
    <BaseNode {...props}>
      <p className="font-semibold text-cyan-700">{config.modelId}</p>
      <p className="line-clamp-2">{config.queryTemplate}</p>
    </BaseNode>
  );
};

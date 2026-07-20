import type { NodeProps } from '@xyflow/react';
import type { AnswerNodeConfig, BotFlowNode } from '../../features/flow-builder/flow-builder.types';
import { BaseNode } from './BaseNode';

export const AnswerNode = (props: NodeProps<BotFlowNode>) => {
  const config = props.data.config.data as AnswerNodeConfig;

  return (
    <BaseNode {...props}>
      <p className="line-clamp-3">{config.template || 'No answer template.'}</p>
    </BaseNode>
  );
};

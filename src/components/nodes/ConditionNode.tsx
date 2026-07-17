import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { BotFlowNode, ConditionNodeConfig } from '../../features/flow-builder/flow-builder.types';
import { BaseNode } from './BaseNode';

export const ConditionNode = (props: NodeProps<BotFlowNode>) => {
  const config = props.data.config as ConditionNodeConfig;

  return (
    <BaseNode {...props} showOutput={false}>
      <p>
        {config.variable || 'variable'} {config.operator} {config.value || 'value'}
      </p>
      <Handle id="true" type="source" position={Position.Right} className="!top-[44%] !h-3 !w-3 !bg-green-600" />
      <Handle id="false" type="source" position={Position.Right} className="!top-[72%] !h-3 !w-3 !bg-red-600" />
      <span className="absolute right-3 top-[38%] text-[10px] font-semibold text-green-700">True</span>
      <span className="absolute right-3 top-[66%] text-[10px] font-semibold text-red-700">False</span>
    </BaseNode>
  );
};

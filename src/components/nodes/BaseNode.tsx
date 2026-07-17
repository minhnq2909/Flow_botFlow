import { Handle, NodeResizer, Position, type NodeProps } from '@xyflow/react';
import type { ReactNode } from 'react';
import type { BotFlowNode } from '../../features/flow-builder/flow-builder.types';
import { NODE_COLORS } from '../../features/flow-builder/flow-builder.constants';

type BaseNodeProps = NodeProps<BotFlowNode> & {
  children?: ReactNode;
  showInput?: boolean;
  showOutput?: boolean;
};

export const BaseNode = ({ data, selected, children, showInput = true, showOutput = true }: BaseNodeProps) => {
  const color = NODE_COLORS[data.botType];

  return (
    <div
      className={`h-full min-h-24 min-w-48 rounded-lg border-2 bg-white shadow-sm transition ${
        selected ? 'border-ink shadow-panel' : 'border-slate-200'
      }`}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={192}
        minHeight={96}
        handleClassName="!h-3 !w-3 !border-2 !border-white !bg-ink"
        lineClassName="!border-ink"
      />
      {showInput ? (
        <Handle id="input" type="target" position={Position.Left} className="!h-3 !w-3 !bg-slate-500" />
      ) : null}
      <div className="border-b border-slate-100 px-3 py-2" style={{ borderTop: `4px solid ${color}` }}>
        <p className="text-sm font-semibold text-slate-900">{data.config.name}</p>
        <p className="text-xs uppercase tracking-wide text-slate-500">{data.botType.replace('_', ' ')}</p>
      </div>
      {children ? <div className="px-3 py-2 text-xs text-slate-600">{children}</div> : null}
      {showOutput ? (
        <Handle id="output" type="source" position={Position.Right} className="!h-3 !w-3" style={{ backgroundColor: color }} />
      ) : null}
    </div>
  );
};

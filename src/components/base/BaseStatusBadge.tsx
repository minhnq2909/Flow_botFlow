import type { NodeExecutionStatus } from '../../features/flow-builder/flow-builder.types';

type BaseStatusBadgeProps = {
  status: NodeExecutionStatus;
};

const classes: Record<NodeExecutionStatus, string> = {
  idle: 'bg-slate-100 text-slate-700',
  queued: 'bg-blue-50 text-blue-700',
  running: 'bg-amber-50 text-amber-700',
  completed: 'bg-green-50 text-green-700',
  failed: 'bg-red-50 text-red-700',
  skipped: 'bg-slate-200 text-slate-600',
};

export const BaseStatusBadge = ({ status }: BaseStatusBadgeProps) => (
  <span className={`rounded px-2 py-1 text-xs font-semibold ${classes[status]}`}>{status}</span>
);

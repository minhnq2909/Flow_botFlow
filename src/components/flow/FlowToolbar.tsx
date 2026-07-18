import { Hammer, MousePointer2, Trash2 } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

type FlowToolbarProps = {
  flowName: string;
  onFlowNameChange: (value: string) => void;
  onBuild: () => void;
  onClear: () => void;
  onDeleteSelected: () => void;
  selectedItemCount: number;
};

export const FlowToolbar = ({
  flowName,
  onFlowNameChange,
  onBuild,
  onClear,
  onDeleteSelected,
  selectedItemCount,
}: FlowToolbarProps) => (
  <header className="flex h-16 shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-4">
    <h1 className="w-56 text-lg font-bold text-ink">Flow Bot Builder</h1>
    <div className="w-80">
      <Input
        aria-label="Flow name"
        value={flowName}
        onChange={(event) => onFlowNameChange(event.target.value)}
        placeholder="Flow name"
      />
    </div>
    <div className="ml-auto flex items-center gap-2">
      <Button
        variant="secondary"
        onClick={onDeleteSelected}
        icon={<MousePointer2 size={16} />}
        title="Delete selected nodes and edges"
        disabled={selectedItemCount === 0}
      >
        Delete Selected{selectedItemCount > 0 ? ` (${selectedItemCount})` : ''}
      </Button>
      <Button variant="danger" onClick={onClear} icon={<Trash2 size={16} />} title="Clear Flow">
        Clear Flow
      </Button>
      <Button variant="primary" onClick={onBuild} icon={<Hammer size={16} />} title="Build JSON">
        Build JSON
      </Button>
    </div>
  </header>
);

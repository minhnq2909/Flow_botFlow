import { PanelLeftClose } from 'lucide-react';
import { NODE_PALETTE } from '../../features/flow-builder/flow-builder.constants';
import { Button } from '../common/Button';

type NodePaletteProps = {
  onCollapse: () => void;
};

export const NodePalette = ({ onCollapse }: NodePaletteProps) => (
  <aside className="w-72 shrink-0 border-r border-slate-200 bg-white p-4">
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Node Palette</h2>
      <Button
        className="h-8 border-slate-300 px-2 text-xs"
        variant="secondary"
        onClick={onCollapse}
        title="Hide node palette"
        aria-label="Hide node palette"
      >
        <PanelLeftClose size={16} />
        Ẩn
      </Button>
    </div>
    <div className="grid gap-3">
      {NODE_PALETTE.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.type}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData('application/reactflow', item.type);
              event.dataTransfer.effectAllowed = 'move';
            }}
            className={`rounded-lg border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${item.colorClass}`}
          >
            <div className="flex items-center gap-3">
              <Icon size={20} />
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="mt-1 text-xs leading-5 opacity-80">{item.description}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  </aside>
);

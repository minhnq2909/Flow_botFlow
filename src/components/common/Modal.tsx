import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

type ModalProps = {
  title: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
};

export const Modal = ({ title, children, footer, onClose }: ModalProps) => (
  <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-6">
    <section className="flex max-h-[86vh] w-full max-w-3xl flex-col rounded-lg bg-white shadow-panel">
      <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <Button variant="ghost" onClick={onClose} aria-label="Close modal" title="Close">
          <X size={18} />
        </Button>
      </header>
      <div className="min-h-0 flex-1 overflow-auto p-5">{children}</div>
      {footer ? <footer className="border-t border-slate-200 px-5 py-4">{footer}</footer> : null}
    </section>
  </div>
);

import type { TextareaHTMLAttributes } from 'react';

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
};

export const Textarea = ({ label, className = '', ...props }: TextareaProps) => (
  <label className="grid gap-1.5 text-sm font-medium text-slate-700">
    {label ? <span>{label}</span> : null}
    <textarea
      className={`min-h-24 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-ink focus:ring-2 focus:ring-ink/15 ${className}`}
      {...props}
    />
  </label>
);

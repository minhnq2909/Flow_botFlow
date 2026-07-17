import type { InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export const Input = ({ label, className = '', ...props }: InputProps) => (
  <label className="grid gap-1.5 text-sm font-medium text-slate-700">
    {label ? <span>{label}</span> : null}
    <input
      className={`h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-ink focus:ring-2 focus:ring-ink/15 ${className}`}
      {...props}
    />
  </label>
);

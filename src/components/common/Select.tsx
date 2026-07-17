import type { SelectHTMLAttributes } from 'react';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  options: string[];
};

export const Select = ({ label, options, className = '', ...props }: SelectProps) => (
  <label className="grid gap-1.5 text-sm font-medium text-slate-700">
    {label ? <span>{label}</span> : null}
    <select
      className={`h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-ink focus:ring-2 focus:ring-ink/15 ${className}`}
      {...props}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </label>
);

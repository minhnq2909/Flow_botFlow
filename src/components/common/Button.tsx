import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  icon?: ReactNode;
};

const variants = {
  primary: 'bg-ink text-white hover:bg-slate-700 disabled:bg-slate-300',
  secondary:
    'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:text-slate-400',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
  ghost: 'text-slate-600 hover:bg-slate-100 disabled:text-slate-400',
};

export const Button = ({
  children,
  className = '',
  icon,
  variant = 'secondary',
  ...props
}: ButtonProps) => (
  <button
    className={`inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    {...props}
  >
    {icon}
    {children}
  </button>
);

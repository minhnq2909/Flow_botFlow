import { Textarea } from '../common/Textarea';

type BaseTextareaProps = {
  value: string;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

export const BaseTextarea = ({
  value,
  label,
  placeholder,
  error,
  disabled,
  onChange,
}: BaseTextareaProps) => (
  <div className="grid gap-1">
    <Textarea
      label={label}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    />
    {error ? <span className="text-xs text-red-600">{error}</span> : null}
  </div>
);

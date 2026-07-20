import { Input } from '../common/Input';

type BaseInputProps = {
  value: string;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onBlur?: () => void;
};

export const BaseInput = ({
  value,
  label,
  placeholder,
  error,
  disabled,
  onChange,
  onBlur,
}: BaseInputProps) => (
  <div className="grid gap-1">
    <Input
      label={label}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onBlur={onBlur}
      onChange={(event) => onChange(event.target.value)}
    />
    {error ? <span className="text-xs text-red-600">{error}</span> : null}
  </div>
);

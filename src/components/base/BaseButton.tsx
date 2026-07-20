import type { ReactNode } from 'react';
import { Button } from '../common/Button';

type BaseButtonProps = {
  children?: ReactNode;
  label?: string;
  disabled?: boolean;
  onClick: () => void;
};

export const BaseButton = ({ children, label, disabled, onClick }: BaseButtonProps) => (
  <Button disabled={disabled} onClick={onClick}>
    {children ?? label}
  </Button>
);

import type { ValidationError } from '../../features/flow-builder/flow-builder.types';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

type ValidationErrorsModalProps = {
  errors: ValidationError[];
  onClose: () => void;
};

export const ValidationErrorsModal = ({ errors, onClose }: ValidationErrorsModalProps) => (
  <Modal
    title="Không thể build flow"
    onClose={onClose}
    footer={
      <div className="flex justify-end">
        <Button variant="primary" onClick={onClose}>
          Đã hiểu
        </Button>
      </div>
    }
  >
    <ul className="grid gap-2 text-sm text-slate-700">
      {errors.map((error) => (
        <li
          key={`${error.code}-${error.nodeId ?? error.edgeId ?? error.message}`}
          className="rounded-md bg-red-50 p-3 text-red-800"
        >
          {error.message}
        </li>
      ))}
    </ul>
  </Modal>
);

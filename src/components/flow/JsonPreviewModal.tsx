import { Check, Copy, Download } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { BuiltFlowJson } from '../../features/flow-builder/flow-builder.types';
import { slugify } from '../../features/flow-builder/flow-builder.utils';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

type JsonPreviewModalProps = {
  json: BuiltFlowJson;
  onClose: () => void;
};

export const downloadJson = (json: BuiltFlowJson) => {
  const content = JSON.stringify(json, null, 2);
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${slugify(json.flow.name)}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

export const JsonPreviewModal = ({ json, onClose }: JsonPreviewModalProps) => {
  const [notice, setNotice] = useState<string | null>(null);
  const formattedJson = useMemo(() => JSON.stringify(json, null, 2), [json]);

  const copyJson = async () => {
    await navigator.clipboard.writeText(formattedJson);
    setNotice('JSON copied to clipboard.');
  };

  return (
    <Modal
      title="JSON Preview"
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-green-700">{notice}</p>
          <div className="flex gap-2">
            <Button onClick={copyJson} icon={<Copy size={16} />}>
              Copy
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                downloadJson(json);
                setNotice('JSON downloaded.');
              }}
              icon={<Download size={16} />}
            >
              Download
            </Button>
            <Button variant="ghost" onClick={onClose} icon={<Check size={16} />}>
              Close
            </Button>
          </div>
        </div>
      }
    >
      <pre className="max-h-[56vh] overflow-auto rounded-lg bg-slate-950 p-4 text-xs leading-5 text-slate-100">
        {formattedJson}
      </pre>
    </Modal>
  );
};

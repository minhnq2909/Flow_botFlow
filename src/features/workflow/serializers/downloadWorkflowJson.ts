import type { BuiltFlowJson } from '../../flow-builder/flow-builder.types';
import { slugify } from '../../flow-builder/flow-builder.utils';

export const downloadWorkflowJson = (json: BuiltFlowJson) => {
  const content = JSON.stringify(json, null, 2);
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${slugify(json.workflow.name)}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

import type { WorkflowDocument, WorkflowRunResult } from '../../flow-builder/flow-builder.types';

export const runWorkflow = async (
  workflow: WorkflowDocument,
  inputs: Record<string, unknown>,
): Promise<WorkflowRunResult> => {
  const response = await fetch('/api/v1/workflows/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workflow, inputs }),
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(error?.message ?? 'Workflow run failed.');
  }

  return (await response.json()) as WorkflowRunResult;
};

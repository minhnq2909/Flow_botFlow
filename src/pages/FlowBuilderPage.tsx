import { useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { AlertCircle, PanelLeftOpen, PanelRightOpen, X } from 'lucide-react';
import { FlowCanvas } from '../components/flow/FlowCanvas';
import { FlowToolbar } from '../components/flow/FlowToolbar';
import { JsonPreviewModal } from '../components/flow/JsonPreviewModal';
import { NodePalette } from '../components/flow/NodePalette';
import { PropertiesPanel } from '../components/flow/PropertiesPanel';
import { ValidationErrorsModal } from '../components/flow/ValidationErrorsModal';
import { useFlowBuilder } from '../hooks/useFlowBuilder';
import type {
  BuiltFlowJson,
  NodeExecutionState,
  ValidationError,
  WorkflowRunResult,
} from '../features/flow-builder/flow-builder.types';
import { Button } from '../components/common/Button';
import { runWorkflow } from '../features/workflow/api/workflowApi';
import { downloadWorkflowJson } from '../features/workflow/serializers/downloadWorkflowJson';

export const FlowBuilderPage = () => {
  const flow = useFlowBuilder();
  const [builtJson, setBuiltJson] = useState<BuiltFlowJson | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [runResult, setRunResult] = useState<WorkflowRunResult | null>(null);
  const [nodeExecutions, setNodeExecutions] = useState<Record<string, NodeExecutionState>>({});
  const [isNodePaletteOpen, setIsNodePaletteOpen] = useState(true);
  const [isPropertiesPanelOpen, setIsPropertiesPanelOpen] = useState(true);

  const handleBuild = () => {
    const result = flow.build();
    if (result.errors.length > 0) {
      setValidationErrors(result.errors);
      return;
    }
    setBuiltJson(result.json);
  };

  const handleExport = () => {
    downloadWorkflowJson(flow.exportWorkflow());
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const json = JSON.parse(await file.text()) as unknown;
        const result = flow.importWorkflow(json);
        if (!result.ok) {
          setValidationErrors(result.errors);
          return;
        }
        flow.setMessage('Workflow imported.');
      } catch (error) {
        flow.setMessage(error instanceof Error ? error.message : 'Import failed.');
      }
    };
    input.click();
  };

  const handleRun = async () => {
    setRunResult(null);
    setNodeExecutions(
      Object.fromEntries(
        flow.nodes.map((node) => [node.id, { nodeId: node.id, status: 'queued' as const }]),
      ),
    );
    try {
      const result = await runWorkflow(flow.exportWorkflow(), {
        query: window.prompt('Query input', 'What is retrieval-augmented generation?') ?? '',
      });
      setRunResult(result);
      setNodeExecutions(result.nodeExecutions);
    } catch (error) {
      flow.setMessage(error instanceof Error ? error.message : 'Workflow run failed.');
      setNodeExecutions((current) =>
        Object.fromEntries(
          Object.entries(current).map(([nodeId, execution]) => [
            nodeId,
            execution.status === 'queued'
              ? {
                  ...execution,
                  status: 'skipped' as const,
                  error: { code: 'WORKFLOW_EXECUTION_FAILED', message: 'Run did not complete.' },
                }
              : execution,
          ]),
        ),
      );
    }
  };

  return (
    <ReactFlowProvider>
      <div className="flex h-screen flex-col overflow-hidden bg-slate-100 text-slate-900">
        <FlowToolbar
          flowName={flow.flowName}
          onFlowNameChange={flow.setFlowName}
          onBuild={handleBuild}
          onExportWorkflow={handleExport}
          onImportWorkflow={handleImport}
          onRunWorkflow={handleRun}
          onClear={flow.clearFlow}
          onDeleteSelected={flow.deleteSelected}
          selectedItemCount={flow.selectedItemCount}
        />

        {flow.message ? (
          <div className="flex items-center gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
            <AlertCircle size={16} />
            <span>{flow.message}</span>
            <Button
              className="ml-auto h-8 px-2"
              variant="ghost"
              onClick={() => flow.setMessage(null)}
              title="Dismiss"
            >
              <X size={16} />
            </Button>
          </div>
        ) : null}

        <div className="relative flex min-h-0 flex-1">
          {isNodePaletteOpen ? (
            <NodePalette onCollapse={() => setIsNodePaletteOpen(false)} />
          ) : (
            <Button
              className="absolute left-3 top-3 z-10 h-10 border-slate-300 bg-white px-3 shadow-md"
              variant="secondary"
              onClick={() => setIsNodePaletteOpen(true)}
              title="Show node palette"
              aria-label="Show node palette"
            >
              <PanelLeftOpen size={16} />
              Nodes
            </Button>
          )}
          <FlowCanvas
            nodes={flow.nodes}
            edges={flow.edges}
            onNodesChange={flow.onNodesChange}
            onEdgesChange={flow.onEdgesChange}
            onConnect={flow.connectNodes}
            onAddNode={flow.addNode}
            onSelectNode={flow.setSelectedNodeId}
            nodeExecutions={nodeExecutions}
          />
          {isPropertiesPanelOpen ? (
            <PropertiesPanel
              selectedNode={flow.selectedNode}
              selectedNodeExecution={
                flow.selectedNode ? nodeExecutions[flow.selectedNode.id] : undefined
              }
              onUpdateConfig={flow.updateNodeConfig}
              onCollapse={() => setIsPropertiesPanelOpen(false)}
            />
          ) : (
            <Button
              className="absolute right-3 top-3 z-10 h-10 border-slate-300 bg-white px-3 shadow-md"
              variant="secondary"
              onClick={() => setIsPropertiesPanelOpen(true)}
              title="Show properties"
              aria-label="Show properties"
            >
              <PanelRightOpen size={16} />
              Properties
            </Button>
          )}
        </div>

        {builtJson ? (
          <JsonPreviewModal json={builtJson} onClose={() => setBuiltJson(null)} />
        ) : null}
        {validationErrors.length > 0 ? (
          <ValidationErrorsModal
            errors={validationErrors}
            onClose={() => setValidationErrors([])}
          />
        ) : null}
        {runResult ? (
          <div className="absolute bottom-4 right-4 z-20 w-80 rounded-lg border border-slate-300 bg-white p-4 shadow-panel">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Workflow Run</h2>
              <Button variant="ghost" onClick={() => setRunResult(null)}>
                Close
              </Button>
            </div>
            <dl className="grid gap-2 text-sm text-slate-700">
              <div className="flex justify-between gap-4">
                <dt>Status</dt>
                <dd className="font-semibold">{runResult.status}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Run ID</dt>
                <dd className="font-mono text-xs">{runResult.runId}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Trace ID</dt>
                <dd className="font-mono text-xs">{runResult.traceId ?? '-'}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Click từng node trên canvas để xem output, lỗi, latency và token usage.
            </p>
          </div>
        ) : null}
      </div>
    </ReactFlowProvider>
  );
};

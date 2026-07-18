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
import type { BuiltFlowJson, ValidationError } from '../features/flow-builder/flow-builder.types';
import { Button } from '../components/common/Button';

export const FlowBuilderPage = () => {
  const flow = useFlowBuilder();
  const [builtJson, setBuiltJson] = useState<BuiltFlowJson | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
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

  return (
    <ReactFlowProvider>
      <div className="flex h-screen flex-col overflow-hidden bg-slate-100 text-slate-900">
        <FlowToolbar
          flowName={flow.flowName}
          onFlowNameChange={flow.setFlowName}
          onBuild={handleBuild}
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
          />
          {isPropertiesPanelOpen ? (
            <PropertiesPanel
              selectedNode={flow.selectedNode}
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
      </div>
    </ReactFlowProvider>
  );
};

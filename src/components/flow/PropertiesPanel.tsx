import { PanelRightClose } from 'lucide-react';
import type {
  BotFlowNode,
  BotNodeConfig,
  NodeExecutionState,
} from '../../features/flow-builder/flow-builder.types';
import { WORKFLOW_VALUE_TYPES } from '../../features/flow-builder/flow-builder.constants';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Textarea } from '../common/Textarea';
import { Button } from '../common/Button';

type PropertiesPanelProps = {
  selectedNode: BotFlowNode | null;
  selectedNodeExecution?: NodeExecutionState;
  onUpdateConfig: (nodeId: string, config: BotNodeConfig) => void;
  onCollapse: () => void;
};

export const PropertiesPanel = ({
  selectedNode,
  selectedNodeExecution,
  onUpdateConfig,
  onCollapse,
}: PropertiesPanelProps) => {
  const header = (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Properties</h2>
      <Button
        className="h-8 border-slate-300 px-2 text-xs"
        variant="secondary"
        onClick={onCollapse}
      >
        <PanelRightClose size={16} />
        Ẩn
      </Button>
    </div>
  );

  if (!selectedNode) {
    return (
      <aside className="w-80 shrink-0 border-l border-slate-200 bg-white p-4">
        {header}
        <div className="mt-6 rounded-lg border border-dashed border-slate-300 p-4 text-sm leading-6 text-slate-600">
          Chọn một node trên canvas để chỉnh cấu hình.
        </div>
      </aside>
    );
  }

  const updateConfig = (config: BotNodeConfig) => onUpdateConfig(selectedNode.id, config);
  const config = selectedNode.data.config;

  return (
    <aside className="w-80 shrink-0 overflow-auto border-l border-slate-200 bg-white p-4">
      {header}
      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
        <p className="font-semibold text-slate-800">{selectedNode.id}</p>
        <p>{selectedNode.data.label}</p>
      </div>
      <div className="mt-5 grid gap-4">
        {config.type === 'begin' ? (
          <>
            <Input
              label="Variable name"
              value={config.data.variables[0]?.name ?? ''}
              onChange={(event) =>
                updateConfig({
                  type: 'begin',
                  data: {
                    variables: [
                      {
                        name: event.target.value,
                        dataType: config.data.variables[0]?.dataType ?? 'string',
                        required: config.data.variables[0]?.required ?? true,
                      },
                    ],
                  },
                })
              }
            />
            <Select
              label="Data type"
              options={[...WORKFLOW_VALUE_TYPES]}
              value={config.data.variables[0]?.dataType ?? 'string'}
              onChange={(event) =>
                updateConfig({
                  type: 'begin',
                  data: {
                    variables: [
                      {
                        name: config.data.variables[0]?.name ?? 'query',
                        dataType: event.target.value as (typeof WORKFLOW_VALUE_TYPES)[number],
                        required: true,
                      },
                    ],
                  },
                })
              }
            />
          </>
        ) : null}

        {config.type === 'retrieval' ? (
          <>
            <Input
              label="Knowledge Base ID"
              value={config.data.knowledgeBaseId}
              onChange={(event) =>
                updateConfig({
                  type: 'retrieval',
                  data: { ...config.data, knowledgeBaseId: event.target.value },
                })
              }
            />
            <Input
              label="Query template"
              value={config.data.queryTemplate}
              onChange={(event) =>
                updateConfig({
                  type: 'retrieval',
                  data: { ...config.data, queryTemplate: event.target.value },
                })
              }
            />
            <Input
              label="Maximum results"
              type="number"
              value={String(config.data.maxResults)}
              onChange={(event) =>
                updateConfig({
                  type: 'retrieval',
                  data: { ...config.data, maxResults: Number(event.target.value) },
                })
              }
            />
          </>
        ) : null}

        {config.type === 'web_search' ? (
          <>
            <Input
              label="Model"
              value={config.data.modelId}
              onChange={(event) =>
                updateConfig({
                  type: 'web_search',
                  data: { ...config.data, modelId: event.target.value },
                })
              }
            />
            <Input
              label="Query template"
              value={config.data.queryTemplate}
              onChange={(event) =>
                updateConfig({
                  type: 'web_search',
                  data: { ...config.data, queryTemplate: event.target.value },
                })
              }
            />
            <Textarea
              label="Allowed domains"
              value={(config.data.allowedDomains ?? []).join('\n')}
              onChange={(event) =>
                updateConfig({
                  type: 'web_search',
                  data: {
                    ...config.data,
                    allowedDomains: event.target.value
                      .split('\n')
                      .map((domain) => domain.trim())
                      .filter(Boolean),
                  },
                })
              }
            />
          </>
        ) : null}

        {config.type === 'llm' ? (
          <>
            <Input
              label="Model"
              value={config.data.modelId}
              onChange={(event) =>
                updateConfig({ type: 'llm', data: { ...config.data, modelId: event.target.value } })
              }
            />
            <Textarea
              label="System prompt"
              value={config.data.systemPrompt}
              onChange={(event) =>
                updateConfig({
                  type: 'llm',
                  data: { ...config.data, systemPrompt: event.target.value },
                })
              }
            />
            <Textarea
              label="User prompt template"
              value={config.data.userPromptTemplate}
              onChange={(event) =>
                updateConfig({
                  type: 'llm',
                  data: { ...config.data, userPromptTemplate: event.target.value },
                })
              }
            />
          </>
        ) : null}

        {config.type === 'answer' ? (
          <Textarea
            label="Template"
            value={config.data.template}
            onChange={(event) =>
              updateConfig({ type: 'answer', data: { template: event.target.value } })
            }
          />
        ) : null}

        {config.type === 'end' ? (
          <Input
            label="Output variable"
            value={config.data.outputVariable}
            onChange={(event) =>
              updateConfig({ type: 'end', data: { outputVariable: event.target.value } })
            }
          />
        ) : null}
      </div>
      <NodeExecutionDetail execution={selectedNodeExecution} />
    </aside>
  );
};

const formatJson = (value: unknown) => JSON.stringify(value, null, 2);

const NodeExecutionDetail = ({ execution }: { execution?: NodeExecutionState }) => {
  if (!execution) {
    return (
      <section className="mt-6 rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-600">
        Chưa có kết quả run cho node này.
      </section>
    );
  }

  return (
    <section className="mt-6 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900">Run result</h3>
        <span className="rounded bg-white px-2 py-1 text-xs font-semibold text-slate-700">
          {execution.status}
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-2 text-xs text-slate-600">
        <div>
          <dt className="font-semibold text-slate-800">Duration</dt>
          <dd>{execution.durationMs ?? 0} ms</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-800">Tokens</dt>
          <dd>{execution.usage?.totalTokens ?? '-'}</dd>
        </div>
      </dl>
      {execution.error ? (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          <p className="font-semibold">{execution.error.code ?? 'ERROR'}</p>
          <p>{execution.error.message}</p>
        </div>
      ) : null}
      {execution.output !== undefined ? (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Output
          </p>
          <pre className="max-h-80 overflow-auto rounded bg-slate-950 p-3 text-xs leading-5 text-slate-100">
            {formatJson(execution.output)}
          </pre>
        </div>
      ) : null}
      {execution.input !== undefined ? (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Input</p>
          <pre className="max-h-48 overflow-auto rounded bg-white p-3 text-xs leading-5 text-slate-700">
            {formatJson(execution.input)}
          </pre>
        </div>
      ) : null}
    </section>
  );
};

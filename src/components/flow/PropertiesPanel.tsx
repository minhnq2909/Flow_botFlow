import type {
  ApiRequestNodeConfig,
  BotFlowNode,
  BotNodeConfig,
  ConditionNodeConfig,
  EndNodeConfig,
  MessageNodeConfig,
  StartNodeConfig,
} from '../../features/flow-builder/flow-builder.types';
import { CONDITION_OPERATORS, HTTP_METHODS } from '../../features/flow-builder/flow-builder.constants';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Textarea } from '../common/Textarea';

type PropertiesPanelProps = {
  selectedNode: BotFlowNode | null;
  onUpdateConfig: (nodeId: string, config: BotNodeConfig) => void;
};

export const PropertiesPanel = ({ selectedNode, onUpdateConfig }: PropertiesPanelProps) => {
  if (!selectedNode) {
    return (
      <aside className="w-80 shrink-0 border-l border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Properties</h2>
        <div className="mt-6 rounded-lg border border-dashed border-slate-300 p-4 text-sm leading-6 text-slate-600">
          Chọn một node trên canvas để chỉnh cấu hình. Có thể nhấn Delete hoặc Backspace để xóa
          node/edge đang chọn.
        </div>
      </aside>
    );
  }

  const update = (patch: Partial<BotNodeConfig>) => {
    onUpdateConfig(selectedNode.id, { ...selectedNode.data.config, ...patch } as BotNodeConfig);
  };

  const renderFields = () => {
    if (selectedNode.data.botType === 'start') {
      const config = selectedNode.data.config as StartNodeConfig;
      return <Input label="Node name" value={config.name} onChange={(event) => update({ name: event.target.value })} />;
    }

    if (selectedNode.data.botType === 'message') {
      const config = selectedNode.data.config as MessageNodeConfig;
      return (
        <>
          <Input label="Node name" value={config.name} onChange={(event) => update({ name: event.target.value })} />
          <Textarea
            label="Message content"
            value={config.content}
            placeholder="Xin chào {{customerName}}, tôi có thể giúp gì?"
            onChange={(event) => update({ content: event.target.value })}
          />
        </>
      );
    }

    if (selectedNode.data.botType === 'condition') {
      const config = selectedNode.data.config as ConditionNodeConfig;
      return (
        <>
          <Input label="Node name" value={config.name} onChange={(event) => update({ name: event.target.value })} />
          <Input label="Variable" value={config.variable} onChange={(event) => update({ variable: event.target.value })} />
          <Select
            label="Operator"
            options={[...CONDITION_OPERATORS]}
            value={config.operator}
            onChange={(event) => update({ operator: event.target.value as ConditionNodeConfig['operator'] })}
          />
          <Input label="Compare value" value={config.value} onChange={(event) => update({ value: event.target.value })} />
        </>
      );
    }

    if (selectedNode.data.botType === 'api_request') {
      const config = selectedNode.data.config as ApiRequestNodeConfig;
      return (
        <>
          <Input label="Node name" value={config.name} onChange={(event) => update({ name: event.target.value })} />
          <Select
            label="HTTP method"
            options={[...HTTP_METHODS]}
            value={config.method}
            onChange={(event) => update({ method: event.target.value as ApiRequestNodeConfig['method'] })}
          />
          <Input label="URL" value={config.url} placeholder="https://api.example.com" onChange={(event) => update({ url: event.target.value })} />
          <Textarea label="Request body" value={config.body} onChange={(event) => update({ body: event.target.value })} />
          <Input
            label="Response variable"
            value={config.responseVariable}
            onChange={(event) => update({ responseVariable: event.target.value })}
          />
        </>
      );
    }

    const config = selectedNode.data.config as EndNodeConfig;
    return <Input label="Node name" value={config.name} onChange={(event) => update({ name: event.target.value })} />;
  };

  return (
    <aside className="w-80 shrink-0 overflow-auto border-l border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Properties</h2>
      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
        <p className="font-semibold text-slate-800">{selectedNode.id}</p>
        <p>{selectedNode.data.botType.replace('_', ' ')}</p>
      </div>
      <div className="mt-5 grid gap-4">{renderFields()}</div>
    </aside>
  );
};

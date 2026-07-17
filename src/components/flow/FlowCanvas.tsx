import { useCallback, useMemo, type DragEvent } from 'react';
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
  type NodeTypes,
  useReactFlow,
} from '@xyflow/react';
import type { BotFlowEdge, BotFlowNode, BotNodeType } from '../../features/flow-builder/flow-builder.types';
import { NODE_COLORS } from '../../features/flow-builder/flow-builder.constants';
import { StartNode } from '../nodes/StartNode';
import { MessageNode } from '../nodes/MessageNode';
import { ConditionNode } from '../nodes/ConditionNode';
import { ApiRequestNode } from '../nodes/ApiRequestNode';
import { EndNode } from '../nodes/EndNode';

type FlowCanvasProps = {
  nodes: BotFlowNode[];
  edges: BotFlowEdge[];
  onNodesChange: OnNodesChange<BotFlowNode>;
  onEdgesChange: OnEdgesChange<BotFlowEdge>;
  onConnect: OnConnect;
  onAddNode: (type: BotNodeType, position: { x: number; y: number }) => void;
  onSelectNode: (nodeId: string | null) => void;
};

const nodeTypes: NodeTypes = {
  start: StartNode,
  message: MessageNode,
  condition: ConditionNode,
  api_request: ApiRequestNode,
  end: EndNode,
};

export const FlowCanvas = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onAddNode,
  onSelectNode,
}: FlowCanvasProps) => {
  const reactFlow = useReactFlow<BotFlowNode, BotFlowEdge>();
  const coloredNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        style: {
          ...node.style,
        },
      })),
    [nodes],
  );

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow') as BotNodeType;
      if (!type) return;
      const position = reactFlow.screenToFlowPosition({ x: event.clientX, y: event.clientY });
      onAddNode(type, position);
    },
    [onAddNode, reactFlow],
  );

  return (
    <main
      className="min-w-0 flex-1 bg-slate-100"
      onDrop={onDrop}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
      }}
    >
      <ReactFlow
        nodes={coloredNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => onSelectNode(node.id)}
        onPaneClick={() => onSelectNode(null)}
        fitView
        deleteKeyCode={['Backspace', 'Delete']}
      >
        <Background color="#cbd5e1" gap={18} />
        <Controls position="bottom-left" />
        <MiniMap
          position="bottom-right"
          nodeColor={(node) => NODE_COLORS[(node as BotFlowNode).data.botType]}
          pannable
          zoomable
        />
      </ReactFlow>
    </main>
  );
};

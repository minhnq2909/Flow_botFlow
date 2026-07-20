import { useCallback, useMemo, type DragEvent } from 'react';
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  SelectionMode,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
  type NodeTypes,
  useReactFlow,
} from '@xyflow/react';
import type {
  BotFlowEdge,
  BotFlowNode,
  BotNodeType,
  NodeExecutionState,
} from '../../features/flow-builder/flow-builder.types';
import { NODE_COLORS } from '../../features/flow-builder/flow-builder.constants';
import { BeginNode } from '../nodes/BeginNode';
import { RetrievalNode } from '../nodes/RetrievalNode';
import { WebSearchNode } from '../nodes/WebSearchNode';
import { LlmNode } from '../nodes/LlmNode';
import { AnswerNode } from '../nodes/AnswerNode';
import { EndNode } from '../nodes/EndNode';

type FlowCanvasProps = {
  nodes: BotFlowNode[];
  edges: BotFlowEdge[];
  onNodesChange: OnNodesChange<BotFlowNode>;
  onEdgesChange: OnEdgesChange<BotFlowEdge>;
  onConnect: OnConnect;
  onAddNode: (type: BotNodeType, position: { x: number; y: number }) => void;
  onSelectNode: (nodeId: string | null) => void;
  nodeExecutions?: Record<string, NodeExecutionState>;
};

const nodeTypes: NodeTypes = {
  begin: BeginNode,
  retrieval: RetrievalNode,
  web_search: WebSearchNode,
  llm: LlmNode,
  answer: AnswerNode,
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
  nodeExecutions = {},
}: FlowCanvasProps) => {
  const reactFlow = useReactFlow<BotFlowNode, BotFlowEdge>();
  const coloredNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          execution: nodeExecutions[node.id],
        },
        style: {
          ...node.style,
        },
      })),
    [nodeExecutions, nodes],
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
        panOnDrag={[1, 2]}
        selectionOnDrag
        selectionMode={SelectionMode.Partial}
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

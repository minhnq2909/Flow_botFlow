import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from '@xyflow/react';
import type {
  BotFlowEdge,
  BotFlowNode,
  BotNodeConfig,
  BotNodeType,
} from '../features/flow-builder/flow-builder.types';
import { buildFlowJson } from '../features/flow-builder/flow-json-builder';
import { validateFlow } from '../features/flow-builder/flow-validator';
import { createBotNode, createId, wouldCreateCycle } from '../features/flow-builder/flow-builder.utils';

const STORAGE_KEY = 'bot-flow-builder-state';

type StoredFlow = {
  flowName: string;
  nodes: BotFlowNode[];
  edges: BotFlowEdge[];
};

const readStoredFlow = (): StoredFlow | null => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value ? (JSON.parse(value) as StoredFlow) : null;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

export const useFlowBuilder = () => {
  const [flowName, setFlowName] = useState('Customer Support Bot');
  const [nodes, setNodes] = useState<BotFlowNode[]>([]);
  const [edges, setEdges] = useState<BotFlowEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const stored = readStoredFlow();
    if (stored) {
      setFlowName(stored.flowName);
      setNodes(stored.nodes);
      setEdges(stored.edges);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ flowName, nodes, edges }));
  }, [edges, flowName, nodes]);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  );
  const selectedItemCount = useMemo(
    () => nodes.filter((node) => node.selected).length + edges.filter((edge) => edge.selected).length,
    [edges, nodes],
  );

  const onNodesChange = useCallback((changes: NodeChange<BotFlowNode>[]) => {
    const removedNodeIds = changes
      .filter((change) => change.type === 'remove')
      .map((change) => change.id);

    setNodes((currentNodes) => applyNodeChanges(changes, currentNodes));
    if (removedNodeIds.length > 0) {
      setEdges((currentEdges) =>
        currentEdges.filter(
          (edge) => !removedNodeIds.includes(edge.source) && !removedNodeIds.includes(edge.target),
        ),
      );
      setSelectedNodeId(null);
    }
  }, []);

  const onEdgesChange = useCallback((changes: EdgeChange<BotFlowEdge>[]) => {
    setEdges((currentEdges) => applyEdgeChanges(changes, currentEdges));
  }, []);

  const addNode = useCallback(
    (type: BotNodeType, position: { x: number; y: number }) => {
      if (type === 'start' && nodes.some((node) => node.data.botType === 'start')) {
        setMessage('Mỗi flow chỉ được có tối đa một Start node.');
        return;
      }

      const node = createBotNode(type, position);
      setNodes((currentNodes) => [...currentNodes, node]);
      setSelectedNodeId(node.id);
    },
    [nodes],
  );

  const updateNodeConfig = useCallback((nodeId: string, config: BotNodeConfig) => {
    setNodes((currentNodes) =>
      currentNodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                label: config.name,
                config,
              },
            }
          : node,
      ),
    );
  }, []);

  const deleteSelected = useCallback(() => {
    const selectedNodeIds = new Set(nodes.filter((node) => node.selected).map((node) => node.id));

    if (selectedNodeIds.size === 0 && !edges.some((edge) => edge.selected)) {
      return;
    }

    setNodes((currentNodes) => currentNodes.filter((node) => !selectedNodeIds.has(node.id)));
    setEdges((currentEdges) =>
      currentEdges.filter(
        (edge) =>
          !edge.selected && !selectedNodeIds.has(edge.source) && !selectedNodeIds.has(edge.target),
      ),
    );
    setSelectedNodeId(null);
  }, [edges, nodes]);

  const clearFlow = useCallback(() => {
    if (!window.confirm('Clear toàn bộ flow hiện tại?')) return;
    setNodes([]);
    setEdges([]);
    setSelectedNodeId(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const connectNodes = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      const sourceNode = nodes.find((node) => node.id === connection.source);
      const targetNode = nodes.find((node) => node.id === connection.target);

      if (!sourceNode || !targetNode) {
        setMessage('Không thể nối vì node nguồn hoặc node đích không tồn tại.');
        return;
      }
      if (connection.source === connection.target) {
        setMessage('Node không được tự kết nối với chính nó.');
        return;
      }
      if (targetNode.data.botType === 'start') {
        setMessage('Start node không được có input.');
        return;
      }
      if (sourceNode.data.botType === 'end') {
        setMessage('End node không được có output.');
        return;
      }
      if (wouldCreateCycle(edges, connection.source, connection.target)) {
        setMessage('Kết nối này sẽ tạo cycle trong flow.');
        return;
      }
      const sourceHandle =
        sourceNode.data.botType === 'condition' ? connection.sourceHandle : 'output';
      const targetHandle = connection.targetHandle ?? 'input';
      const isDuplicate = edges.some(
        (edge) =>
          edge.source === connection.source &&
          edge.target === connection.target &&
          edge.sourceHandle === sourceHandle &&
          edge.targetHandle === targetHandle,
      );
      if (isDuplicate) {
        setMessage('Edge này đã tồn tại.');
        return;
      }

      setEdges((currentEdges) =>
        addEdge(
          {
            ...connection,
            id: createId('edge'),
            sourceHandle,
            targetHandle,
            label:
              sourceNode.data.botType === 'condition'
                ? sourceHandle === 'true'
                  ? 'True'
                  : 'False'
                : undefined,
            animated: sourceNode.data.botType === 'api_request',
            type: 'smoothstep',
          },
          currentEdges,
        ),
      );
    },
    [edges, nodes],
  );

  const build = useCallback(() => {
    const errors = validateFlow(flowName, nodes, edges);
    if (errors.length > 0) {
      return { errors, json: null };
    }
    return { errors: [], json: buildFlowJson(flowName, nodes, edges) };
  }, [edges, flowName, nodes]);

  return {
    flowName,
    setFlowName,
    nodes,
    edges,
    selectedNode,
    selectedNodeId,
    selectedItemCount,
    setSelectedNodeId,
    message,
    setMessage,
    onNodesChange,
    onEdgesChange,
    addNode,
    updateNodeConfig,
    deleteSelected,
    clearFlow,
    connectNodes,
    build,
  };
};

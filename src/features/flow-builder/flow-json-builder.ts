import type { BotFlowEdge, BotFlowNode, BuiltFlowJson } from './flow-builder.types';
import { serializeWorkflowDocument } from '../workflow/serializers/workflowSerializer';

export const buildFlowJson = (
  flowName: string,
  nodes: BotFlowNode[],
  edges: BotFlowEdge[],
): BuiltFlowJson => serializeWorkflowDocument(flowName, nodes, edges);

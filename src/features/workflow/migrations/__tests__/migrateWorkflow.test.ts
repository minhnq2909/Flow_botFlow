import { describe, expect, it } from 'vitest';
import { migrateStoredFlow } from '../migrateWorkflow';

describe('migrateStoredFlow', () => {
  it('migrates supported legacy node types', () => {
    const result = migrateStoredFlow({
      flowName: 'Legacy',
      nodes: [
        {
          id: 'start-1',
          type: 'start',
          position: { x: 0, y: 0 },
          data: { label: 'Start', botType: 'start', config: { name: 'Start' } },
        },
        {
          id: 'message-1',
          type: 'message',
          position: { x: 0, y: 0 },
          data: {
            label: 'Message',
            botType: 'message',
            config: { name: 'Message', content: 'Hello' },
          },
        },
        {
          id: 'api-1',
          type: 'api_request',
          position: { x: 0, y: 0 },
          data: {
            label: 'API',
            botType: 'api_request',
            config: { name: 'API', url: 'https://example.com' },
          },
        },
        {
          id: 'end-1',
          type: 'end',
          position: { x: 0, y: 0 },
          data: { label: 'End', botType: 'end', config: { name: 'End' } },
        },
      ],
      edges: [],
    } as never);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.workflow.workflow.nodes.map((node) => node.type)).toEqual([
        'begin',
        'answer',
        'llm',
        'end',
      ]);
    }
  });

  it('fails unknown legacy node types explicitly', () => {
    const result = migrateStoredFlow({
      flowName: 'Legacy',
      nodes: [
        {
          id: 'condition-1',
          type: 'condition',
          position: { x: 0, y: 0 },
          data: { label: 'Condition', botType: 'condition', config: {} },
        },
      ],
      edges: [],
    } as never);

    expect(result.ok).toBe(false);
  });
});

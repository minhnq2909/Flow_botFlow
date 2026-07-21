import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import multer from 'multer';
import {
  OpenAiLlmService,
  OpenAiVectorStoreService,
  OpenAiWebSearchService,
} from './openaiServices';
import type { KnowledgeBase, WorkflowRunRequest } from './types';
import { WorkflowEngine } from './workflowEngine';
import { initializeLangfuseTelemetry, shutdownLangfuseTelemetry } from './langfuseTelemetry';

dotenv.config();
initializeLangfuseTelemetry();

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: Number(process.env.MAX_UPLOAD_FILE_SIZE_MB ?? 20) * 1024 * 1024 },
});
const knowledgeBases = new Map<string, KnowledgeBase>();
const vectorStoreService = new OpenAiVectorStoreService();
const webSearchService = new OpenAiWebSearchService();
const llmService = new OpenAiLlmService();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/v1/knowledge-bases', (_request, response) => {
  response.json([...knowledgeBases.values()]);
});

app.post('/api/v1/knowledge-bases', async (request, response) => {
  try {
    const name = String(request.body?.name ?? '').trim();
    if (!name)
      return response
        .status(400)
        .json({ code: 'INVALID_WORKFLOW_SCHEMA', message: 'Name is required.' });
    const created = await vectorStoreService.create({ name });
    const now = new Date().toISOString();
    const kb: KnowledgeBase = {
      id: `kb_${Date.now().toString(36)}`,
      name,
      description: request.body?.description,
      provider: 'openai',
      vectorStoreId: created.vectorStoreId,
      status: 'ready',
      createdAt: now,
      updatedAt: now,
    };
    knowledgeBases.set(kb.id, kb);
    response.status(201).json(kb);
  } catch (error) {
    response
      .status(500)
      .json({ code: 'VECTOR_STORE_CREATE_FAILED', message: sanitizeError(error) });
  }
});

app.get('/api/v1/knowledge-bases/:id', (request, response) => {
  const kb = knowledgeBases.get(request.params.id);
  if (!kb)
    return response
      .status(404)
      .json({ code: 'KNOWLEDGE_BASE_NOT_FOUND', message: 'Knowledge Base not found.' });
  response.json(kb);
});

app.delete('/api/v1/knowledge-bases/:id', async (request, response) => {
  const kb = knowledgeBases.get(request.params.id);
  if (!kb)
    return response
      .status(404)
      .json({ code: 'KNOWLEDGE_BASE_NOT_FOUND', message: 'Knowledge Base not found.' });
  await vectorStoreService.delete(kb.vectorStoreId);
  knowledgeBases.delete(kb.id);
  response.status(204).end();
});

app.post('/api/v1/knowledge-bases/:id/files', upload.single('file'), async (request, response) => {
  response.status(501).json({
    code: 'FILE_UPLOAD_FAILED',
    message: `Upload route is wired, but file upload storage is not completed in this MVP. Received ${request.file?.originalname ?? 'no file'}.`,
  });
});

app.get('/api/v1/knowledge-bases/:id/files', (_request, response) => response.json([]));

app.delete('/api/v1/knowledge-bases/:id/files/:fileId', (_request, response) =>
  response.status(204).end(),
);

app.post('/api/v1/knowledge-bases/:id/search', async (request, response) => {
  try {
    const kb = knowledgeBases.get(request.params.id);
    if (!kb)
      return response
        .status(404)
        .json({ code: 'KNOWLEDGE_BASE_NOT_FOUND', message: 'Knowledge Base not found.' });
    const documents = await vectorStoreService.search({
      vectorStoreId: kb.vectorStoreId,
      query: String(request.body?.query ?? ''),
      maxResults: Number(request.body?.maxResults ?? 5),
      scoreThreshold: request.body?.scoreThreshold,
    });
    response.json({ documents });
  } catch (error) {
    response
      .status(500)
      .json({ code: 'VECTOR_STORE_SEARCH_FAILED', message: sanitizeError(error) });
  }
});

app.post('/api/v1/workflows/run', async (request, response) => {
  try {
    const body = request.body as WorkflowRunRequest;
    const engine = new WorkflowEngine(
      knowledgeBases,
      vectorStoreService,
      webSearchService,
      llmService,
    );
    response.json(await engine.run(body.workflow, body.inputs ?? {}));
  } catch (error) {
    response.status(400).json({ code: 'WORKFLOW_EXECUTION_FAILED', message: sanitizeError(error) });
  }
});

const sanitizeError = (error: unknown) =>
  error instanceof Error
    ? error.message.replace(/Bearer\s+\S+/gi, 'Bearer [redacted]')
    : 'Request failed.';

const port = Number(process.env.PORT ?? 8787);
app.listen(port, () => {
  console.log(`Workflow API listening on http://localhost:${port}`);
});

const shutdown = async () => {
  await shutdownLangfuseTelemetry();
  process.exit(0);
};

process.once('SIGINT', () => {
  void shutdown();
});
process.once('SIGTERM', () => {
  void shutdown();
});

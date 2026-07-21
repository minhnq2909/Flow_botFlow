import { LangfuseSpanProcessor } from '@langfuse/otel';
import { startActiveObservation, setActiveTraceIO } from '@langfuse/tracing';
import { NodeSDK } from '@opentelemetry/sdk-node';

type TelemetrySdk = {
  shutdown: () => Promise<void>;
};

let sdk: TelemetrySdk | null = null;

const maskSecrets = (value: unknown): unknown => {
  if (typeof value === 'string') {
    return value
      .replace(/sk-[A-Za-z0-9_-]+/g, 'sk-[redacted]')
      .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]');
  }

  if (Array.isArray(value)) return value.map(maskSecrets);

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        /api[_-]?key|secret|authorization|token/i.test(key) ? key : key,
        /api[_-]?key|secret|authorization|token/i.test(key) ? '[redacted]' : maskSecrets(item),
      ]),
    );
  }

  return value;
};

export const initializeLangfuseTelemetry = () => {
  if (sdk) return sdk;

  const publicKey = process.env.LANGFUSE_PUBLIC_KEY?.trim();
  const secretKey = process.env.LANGFUSE_SECRET_KEY?.trim();
  const baseUrl = process.env.LANGFUSE_BASE_URL?.trim();

  if (!publicKey || !secretKey || !baseUrl) {
    console.warn(
      'Langfuse tracing disabled: LANGFUSE_PUBLIC_KEY, SECRET_KEY, or BASE_URL missing.',
    );
    return null;
  }

  const nodeSdk = new NodeSDK({
    spanProcessors: [
      new LangfuseSpanProcessor({
        publicKey,
        secretKey,
        baseUrl,
        environment: process.env.LANGFUSE_TRACING_ENVIRONMENT ?? process.env.APP_ENV,
        release: process.env.npm_package_version,
        mask: ({ data }) => maskSecrets(data),
      }),
    ],
  });

  nodeSdk.start();
  sdk = nodeSdk;
  return sdk;
};

export const shutdownLangfuseTelemetry = async () => {
  if (!sdk) return;
  await sdk.shutdown();
  sdk = null;
};

export const traceWorkflowRun = async <T>(
  params: {
    input: unknown;
    metadata: Record<string, unknown>;
  },
  fn: () => Promise<T>,
) =>
  startActiveObservation(
    'workflow-run',
    async (span) => {
      setActiveTraceIO({ input: maskSecrets(params.input) });
      span.update({
        input: maskSecrets(params.input),
        metadata: params.metadata,
      });

      try {
        const result = await fn();
        span.update({
          output: maskSecrets(result),
          metadata: { ...params.metadata, status: 'completed' },
        });
        setActiveTraceIO({ output: maskSecrets(result) });
        return result;
      } catch (error) {
        span.update({
          level: 'ERROR',
          statusMessage: error instanceof Error ? error.message : 'Workflow run failed.',
          metadata: { ...params.metadata, status: 'failed' },
        });
        throw error;
      }
    },
    { asType: 'chain' },
  );

export const traceNodeExecution = async <T>(
  params: {
    name: string;
    type: 'span' | 'retriever' | 'generation';
    input?: unknown;
    metadata: Record<string, unknown>;
  },
  fn: () => Promise<T>,
): Promise<T> => {
  const run = async (span: { update: (attributes: Record<string, unknown>) => unknown }) => {
    span.update({
      input: maskSecrets(params.input),
      metadata: params.metadata,
    });

    try {
      const output = await fn();
      span.update({
        output: maskSecrets(output),
        metadata: { ...params.metadata, status: 'completed' },
      });
      return output;
    } catch (error) {
      span.update({
        level: 'ERROR',
        statusMessage: error instanceof Error ? error.message : 'Node execution failed.',
        metadata: { ...params.metadata, status: 'failed' },
      });
      throw error;
    }
  };

  if (params.type === 'retriever') {
    return startActiveObservation(params.name, (span) => run(span), {
      asType: 'retriever',
    }) as Promise<T>;
  }

  if (params.type === 'generation') {
    return startActiveObservation(params.name, (span) => run(span), {
      asType: 'generation',
    }) as Promise<T>;
  }

  return startActiveObservation(params.name, (span) => run(span), { asType: 'span' }) as Promise<T>;
};

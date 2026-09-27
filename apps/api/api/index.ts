import type { IncomingMessage, ServerResponse } from 'node:http';
import { createApiApp } from '../src/app.factory';

/**
 * Serverless entry point for Vercel.
 *
 * Vercel gives each invocation a raw Node request and response. Fastify can
 * take those directly, so the application is built once per warm instance and
 * the request is emitted onto its server - no socket is opened and nothing
 * listens on a port.
 *
 * The instance is cached in module scope. A cold start pays for building the
 * application and opening a database connection; every request after that on
 * the same instance reuses both. `readyPromise` rather than a plain flag
 * matters because two requests can arrive during a cold start, and building
 * the application twice would open two connection pools.
 *
 * `trustProxy` is on: the platform's edge terminates TLS and forwards the
 * client address, which is the one case where those headers can be believed.
 *
 * Two things behave differently here from a long-running process, and both
 * are covered in DEPLOYMENT.md: rate limiting counts per instance rather than
 * globally, and the filesystem is read-only apart from /tmp, so uploads need
 * object storage.
 */

type FastifyServer = { server: { emit: (event: 'request', ...args: unknown[]) => void } };

let readyPromise: Promise<FastifyServer> | null = null;

async function getServer(): Promise<FastifyServer> {
  const { app } = await createApiApp({ trustProxy: true });
  await app.init();

  const instance = app.getHttpAdapter().getInstance();
  // Fastify must finish registering plugins before it can take a request.
  await instance.ready();

  return instance as unknown as FastifyServer;
}

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  readyPromise ??= getServer();

  let server: FastifyServer;
  try {
    server = await readyPromise;
  } catch (error) {
    // A failed build must not poison every later request on this instance.
    readyPromise = null;
    response.statusCode = 500;
    response.setHeader('content-type', 'application/json');
    // The message names what failed, never a value from the environment.
    response.end(
      JSON.stringify({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'The API failed to start.',
      }),
    );
    // eslint-disable-next-line no-console
    console.error(error instanceof Error ? error.message : 'API bootstrap failed.');
    return;
  }

  server.server.emit('request', request, response);
}

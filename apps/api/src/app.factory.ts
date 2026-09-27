import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { AppModule } from './app.module';
import { AppConfig } from './config/app-config';

/**
 * Builds the application, plugins and all.
 *
 * Three callers need exactly the same application: `main.ts`, which then
 * listens on a port; the serverless handler, which hands requests to it; and
 * the integration tests, which inject requests directly. Having one factory
 * means a security header or a plugin option cannot be configured in
 * production and quietly missing from the tests that are supposed to prove
 * it. The only thing that differs between them is who calls `listen`.
 *
 * `trustProxy` is the exception, because it is a property of the deployment
 * rather than of the application: behind a load balancer or a serverless
 * platform the client address arrives in a header, and believing that header
 * anywhere else would let a caller spoof its own IP past the rate limiter.
 */
export interface CreateAppOptions {
  /**
   * Trust `X-Forwarded-For` and friends. Only ever true behind a proxy you
   * control - a platform's own edge, not the open internet.
   */
  trustProxy?: boolean;
}

export async function createApiApp(options: CreateAppOptions = {}): Promise<{
  app: NestFastifyApplication;
  config: AppConfig;
}> {
  // Fails fast with the names of any missing variables, never their values.
  const config = new AppConfig();

  const adapter = new FastifyAdapter({
    trustProxy: options.trustProxy ?? false,
    bodyLimit:
      Math.max(config.storage.maxImageBytes, config.storage.maxDocumentBytes) + 1024 * 1024,
    genReqId: () => crypto.randomUUID(),
  });

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter, {
    bufferLogs: false,
    logger: config.isProduction ? ['log', 'warn', 'error'] : ['log', 'warn', 'error', 'debug'],
  });

  await app.register(cookie, { secret: config.session.secret });

  await app.register(helmet, {
    // The API returns JSON and files, never HTML pages, so a strict CSP that
    // forbids everything is exactly right here. The websites set their own.
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'none'"],
        formAction: ["'none'"],
        imgSrc: ["'self'", 'data:'],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'no-referrer' },
    hsts: config.isProduction
      ? { maxAge: 31_536_000, includeSubDomains: true, preload: true }
      : false,
    xFrameOptions: { action: 'deny' },
  });

  await app.register(cors, {
    origin: config.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['content-type', 'x-request-id', 'x-preview-secret', 'x-revalidate-secret'],
    exposedHeaders: ['x-request-id'],
    maxAge: 600,
  });

  await app.register(rateLimit, {
    global: true,
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.windowSeconds * 1000,
    // Health probes and trusted callers (loopback by default) are exempt, so a
    // static build or an orchestrator probe is never throttled.
    allowList: (request) =>
      request.url.startsWith('/health') || config.rateLimit.allowList.includes(request.ip),
    // Without this the plugin's plain Error would surface as a 500.
    errorResponseBuilder: (_request, context) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Too many requests. Try again in ${context.after}.`,
    }),
  });

  await app.register(multipart, {
    limits: {
      fileSize: Math.max(config.storage.maxImageBytes, config.storage.maxDocumentBytes),
      files: 1,
      fields: 12,
      fieldSize: 8192,
    },
  });

  return { app, config };
}

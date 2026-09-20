import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { AppModule } from './app.module';
import { AppConfig } from './config/app-config';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  // Fails fast with the names of any missing variables, never their values.
  const config = new AppConfig();

  const adapter = new FastifyAdapter({
    // Header-based client IPs are only trusted behind a proxy you control.
    // Enable trustProxy explicitly when deploying behind a load balancer.
    trustProxy: false,
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

  app.enableShutdownHooks();

  await app.listen(config.port, config.host);

  logger.log(`Key Tech Solutions API listening on http://${config.host}:${config.port}`);
  logger.log(`Allowed origins: ${config.corsOrigins.join(', ')}`);
  logger.log(`Storage driver: ${config.storage.driver} | Mail driver: ${config.mail.driver}`);
}

// A failure here must not print the environment; the message names variables only.
bootstrap().catch((error: unknown) => {
  const logger = new Logger('Bootstrap');
  logger.error(error instanceof Error ? error.message : 'Failed to start the API.');
  if (error instanceof Error && error.stack && process.env.NODE_ENV !== 'production') {
    logger.debug(error.stack);
  }
  process.exit(1);
});

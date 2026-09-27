import { Logger } from '@nestjs/common';
import { createApiApp } from './app.factory';

/**
 * Long-running entry point: a container, a VM, or `pnpm dev`.
 *
 * The application itself is built by `app.factory`, which the serverless
 * handler and the integration tests also use. All this file adds is the
 * listening socket and the shutdown hooks a process needs and a function
 * does not.
 */
async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  const { app, config } = await createApiApp({
    // Set TRUST_PROXY=1 only when the API sits behind a proxy you control.
    // Believing forwarded headers otherwise lets a caller spoof its address
    // past the rate limiter.
    trustProxy: process.env.TRUST_PROXY === '1',
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

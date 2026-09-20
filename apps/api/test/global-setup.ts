/**
 * Decides, once, whether the integration suites can run.
 *
 * Jest chooses between `describe` and `describe.skip` while a test file is
 * being loaded, which is too early to await a database connection. Probing
 * here - before any test file is loaded - lets each suite skip itself
 * honestly, so a machine without a database reports "skipped" rather than a
 * page of failures or, worse, a green run that asserted nothing.
 */

import { PrismaClient } from '@prisma/client';

export default async function globalSetup(): Promise<void> {
  const databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
  process.env.INTEGRATION_DB = '0';

  if (!databaseUrl) {
    // eslint-disable-next-line no-console
    console.warn(
      '\nIntegration tests: no TEST_DATABASE_URL or DATABASE_URL set, so every suite will skip.\n',
    );
    return;
  }

  process.env.DATABASE_URL = databaseUrl;

  const prisma = new PrismaClient();
  try {
    await prisma.$queryRaw`SELECT 1`;
    // The suites need the schema, not just a connection.
    await prisma.permission.count();
    process.env.INTEGRATION_DB = '1';
  } catch {
    // eslint-disable-next-line no-console
    console.warn(
      '\nIntegration tests: the database is unreachable or not migrated, so every suite will skip.\n' +
        'Run `pnpm prisma:migrate:deploy` and `pnpm db:seed` against it first.\n',
    );
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }
}

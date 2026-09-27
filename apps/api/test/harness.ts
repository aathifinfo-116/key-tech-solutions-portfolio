/**
 * Integration-test harness.
 *
 * Builds the real application - the same modules, guards, plugins and
 * exception filter as production - and drives it with Fastify's `inject`, so
 * no port is opened and no HTTP client is needed. The only thing that is not
 * production is `listen`.
 *
 * These tests need a reachable PostgreSQL database with the migrations
 * applied. Point TEST_DATABASE_URL at one, or let it fall back to
 * DATABASE_URL. When neither is reachable every suite skips itself with an
 * explicit message, so a machine without a database still runs the rest of
 * the tests rather than reporting failures it cannot fix.
 *
 * Nothing here prints a credential. Test accounts get a random password that
 * lives in memory for the length of the run.
 */

import 'reflect-metadata';
import { randomBytes, randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { AppConfig } from '../src/config/app-config';

export const SESSION_COOKIE = 'kts_admin_session';

/** Values the API needs to boot, chosen so a test run never touches production. */
function applyTestEnvironment(): void {
  const databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
  if (databaseUrl) {
    process.env.DATABASE_URL = databaseUrl;
    process.env.DATABASE_DIRECT_URL = process.env.DATABASE_DIRECT_URL ?? databaseUrl;
  }

  process.env.NODE_ENV = 'test';
  process.env.SESSION_SECRET ??= randomBytes(32).toString('hex');
  process.env.REVALIDATE_SECRET ??= randomBytes(16).toString('hex');
  process.env.PREVIEW_SECRET ??= randomBytes(16).toString('hex');
  process.env.PUBLIC_SITE_URL ??= 'http://localhost:3010';
  process.env.ADMIN_SITE_URL ??= 'http://localhost:3011';
  process.env.API_PUBLIC_URL ??= 'http://localhost:4010';
  process.env.CORS_ORIGINS ??= 'http://localhost:3010,http://localhost:3011';
  process.env.STORAGE_DRIVER ??= 'local';
  process.env.MAIL_DRIVER ??= 'console';
  // Bcrypt at production cost would make every fixture slow; these tests are
  // about behaviour, and the cost factor itself is covered by configuration.
  process.env.PASSWORD_HASH_ROUNDS ??= '4';
  // The suites make many requests in a few seconds; throttling them would
  // test the rate limiter rather than the endpoint under test.
  process.env.RATE_LIMIT_MAX ??= '100000';
}

/**
 * Whether the suites can run, decided by `global-setup.ts` before any test
 * file was loaded. Reading it at load time is what lets a suite choose
 * `describe.skip` instead of pretending to pass.
 */
export const HAS_DATABASE = process.env.INTEGRATION_DB === '1';

/** `describe` when a database is available, `describe.skip` when not. */
export const describeWithDatabase = HAS_DATABASE ? describe : describe.skip;

export interface Harness {
  app: NestFastifyApplication;
  prisma: PrismaClient;
  close: () => Promise<void>;
}

export async function createHarness(): Promise<Harness> {
  applyTestEnvironment();

  const config = new AppConfig();

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

  const app = moduleRef.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter({ trustProxy: false, genReqId: () => randomUUID() }),
    { logger: false },
  );

  await app.register(cookie, { secret: config.session.secret });
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"], baseUri: ["'none'"] },
    },
    hsts: false,
  });
  await app.register(cors, { origin: config.corsOrigins, credentials: true });
  await app.register(rateLimit, {
    global: true,
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.windowSeconds * 1000,
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Too many requests.',
    }),
  });
  await app.register(multipart, { limits: { fileSize: 5_000_000, files: 1 } });

  // The exception filter is registered by AppModule as an APP_FILTER, so it
  // is already in place here - the same one production uses.
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  const prisma = new PrismaClient();

  return {
    app,
    prisma,
    close: async () => {
      await prisma.$disconnect().catch(() => undefined);
      await app.close().catch(() => undefined);
    },
  };
}

/** A throwaway admin account with the given permissions, via a real role. */
export async function createTestUser(
  prisma: PrismaClient,
  options: { permissions: string[]; label: string },
): Promise<{ id: string; email: string; password: string; roleId: string }> {
  const suffix = randomBytes(6).toString('hex');
  const email = `int-${options.label}-${suffix}@keytech.invalid`;
  const password = `Test-${randomBytes(12).toString('base64url')}`;

  const role = await prisma.role.create({
    data: {
      key: `int-test-${options.label}-${suffix}`,
      name: `Integration test ${options.label} ${suffix}`,
      description: 'Created by the integration suite; removed when it finishes.',
      isSystem: false,
    },
  });

  if (options.permissions.length > 0) {
    const permissions = await prisma.permission.findMany({
      where: { key: { in: options.permissions } },
      select: { id: true },
    });
    await prisma.rolePermission.createMany({
      data: permissions.map((permission) => ({ roleId: role.id, permissionId: permission.id })),
      skipDuplicates: true,
    });
  }

  const user = await prisma.adminUser.create({
    data: {
      email,
      name: `Integration ${options.label}`,
      passwordHash: await bcrypt.hash(password, 4),
      status: 'ACTIVE',
      mustChangePassword: false,
      roles: { create: [{ roleId: role.id }] },
    },
  });

  return { id: user.id, email, password, roleId: role.id };
}

export async function deleteTestUser(
  prisma: PrismaClient,
  user: { id: string; roleId: string },
): Promise<void> {
  await prisma.adminSession.deleteMany({ where: { userId: user.id } });
  await prisma.userRole.deleteMany({ where: { userId: user.id } });
  await prisma.auditLog.deleteMany({ where: { actorId: user.id } });
  await prisma.pageRevision.updateMany({ where: { editorId: user.id }, data: { editorId: null } });
  await prisma.adminUser.delete({ where: { id: user.id } }).catch(() => undefined);
  await prisma.rolePermission.deleteMany({ where: { roleId: user.roleId } });
  await prisma.role.delete({ where: { id: user.roleId } }).catch(() => undefined);
}

/** Signs in and returns the session cookie header, or null if refused. */
export async function signIn(
  app: INestApplication,
  email: string,
  password: string,
): Promise<{ status: number; cookie: string | null; body: Record<string, unknown> }> {
  const response = await (app as NestFastifyApplication).inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email, password, rememberDevice: false },
  });

  const setCookie = response.headers['set-cookie'];
  const raw = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
  const session = raw.find((value) => value.startsWith(`${SESSION_COOKIE}=`)) ?? null;

  return {
    status: response.statusCode,
    cookie: session ? session.split(';')[0] : null,
    body: safeJson(response.body),
  };
}

export function safeJson(body: string): Record<string, unknown> {
  try {
    return JSON.parse(body) as Record<string, unknown>;
  } catch {
    return {};
  }
}

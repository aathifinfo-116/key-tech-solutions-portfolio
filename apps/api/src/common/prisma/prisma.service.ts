import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { redactConnectionString } from '@kts/config';

/**
 * Prisma client wrapper.
 *
 * Connection details come from DATABASE_URL only. Nothing here logs a
 * connection string in full: the host is shown, credentials are masked.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
      errorFormat: 'minimal',
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log(
      `Database connected (${redactConnectionString(process.env.DATABASE_URL ?? 'unset')})`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /** True when the database answers a trivial query. Used by /health/ready. */
  async isHealthy(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Deletes every row, respecting foreign keys. Test helper only; refuses to
   * run outside NODE_ENV=test so it can never touch real data.
   */
  async truncateAllForTests(): Promise<void> {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('truncateAllForTests is only available when NODE_ENV=test');
    }
    const tables = await this.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public' AND tablename NOT LIKE '_prisma%'
    `;
    const list = tables.map((t) => `"public"."${t.tablename}"`).join(', ');
    if (list) {
      await this.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE;`);
    }
  }
}

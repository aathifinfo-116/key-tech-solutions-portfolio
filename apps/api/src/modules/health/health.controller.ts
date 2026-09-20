import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { Public } from '../../common/auth/auth.decorators';
import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * Liveness and readiness probes.
 *
 * `/health/live` answers as long as the process is running; `/health/ready`
 * additionally checks the database, so an orchestrator will not route traffic
 * to an instance that cannot serve it. Neither response reveals configuration.
 */
@Public()
@Controller('health')
export class HealthController {
  private readonly startedAt = Date.now();

  constructor(private readonly prisma: PrismaService) {}

  @Get('live')
  live() {
    return { status: 'ok', uptimeSeconds: Math.round((Date.now() - this.startedAt) / 1000) };
  }

  @Get('ready')
  async ready() {
    const database = await this.prisma.isHealthy();
    if (!database) {
      throw new ServiceUnavailableException({
        status: 'unavailable',
        checks: { database: 'down' },
      });
    }
    return { status: 'ok', checks: { database: 'up' } };
  }
}

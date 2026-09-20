import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppConfig } from '../../config/app-config';
import { PUBLIC_FORM_KEY } from '../auth/auth.decorators';
import type { AuthenticatedRequest } from './request-context';

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Per-IP rate limiting for public form submissions.
 *
 * Deliberately in-process: it needs no extra infrastructure and is effective
 * against the casual abuse these endpoints actually attract. It is *per
 * instance*, so a horizontally scaled deployment should put a shared limiter
 * (Redis, or the CDN/WAF) in front of it - see the README security notes.
 * @fastify/rate-limit covers the whole API with a looser ceiling.
 */
@Injectable()
export class PublicFormRateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, Bucket>();
  private lastSweep = Date.now();

  constructor(
    private readonly reflector: Reflector,
    private readonly config: AppConfig,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublicForm = this.reflector.getAllAndOverride<boolean>(PUBLIC_FORM_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!isPublicForm) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const key = `${request.ip ?? 'unknown'}:${request.routeOptions?.url ?? request.url}`;
    const now = Date.now();
    const windowMs = this.config.rateLimit.windowSeconds * 1000;
    const max = this.config.rateLimit.publicFormMax;

    this.sweep(now);

    const bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }

    bucket.count += 1;
    if (bucket.count > max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Too Many Requests',
          message: `Too many submissions. Please try again in ${retryAfter} second${retryAfter === 1 ? '' : 's'}.`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  /** Drops expired buckets at most once a minute so the map cannot grow without bound. */
  private sweep(now: number): void {
    if (now - this.lastSweep < 60_000) return;
    this.lastSweep = now;
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }
  }
}

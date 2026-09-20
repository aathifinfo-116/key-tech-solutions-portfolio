import { randomUUID } from 'node:crypto';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
  createParamDecorator,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Observable, tap } from 'rxjs';
import type { SessionUserDto } from '@kts/shared-types';

export interface AuthenticatedRequest extends FastifyRequest {
  requestId: string;
  currentUser?: SessionUserDto;
  sessionId?: string;
}

/**
 * Assigns a request id, echoes it back and logs one structured line per
 * request. Query strings are logged as-is only for GETs; request bodies are
 * never logged, because they may carry passwords or applicant details.
 */
@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Request');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<AuthenticatedRequest>();
    const reply = http.getResponse<FastifyReply>();

    const incoming = request.headers['x-request-id'];
    request.requestId = (Array.isArray(incoming) ? incoming[0] : incoming) || randomUUID();
    void reply.header('x-request-id', request.requestId);

    const started = Date.now();
    return next.handle().pipe(
      tap({
        next: () => this.log(request, reply.statusCode, started),
        error: () => this.log(request, reply.statusCode || 500, started),
      }),
    );
  }

  private log(request: AuthenticatedRequest, status: number, started: number): void {
    const duration = Date.now() - started;
    const actor = request.currentUser?.email ?? 'anonymous';
    this.logger.log(
      `${request.method} ${request.url} ${status} ${duration}ms actor=${actor} rid=${request.requestId}`,
    );
  }
}

/** Injects the authenticated admin user, or `undefined` on public routes. */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  return ctx.switchToHttp().getRequest<AuthenticatedRequest>().currentUser;
});

/** Injects the current request id for audit records. */
export const RequestId = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  return ctx.switchToHttp().getRequest<AuthenticatedRequest>().requestId;
});

/**
 * Best-effort client IP.
 * `x-forwarded-for` is only honoured when Fastify's `trustProxy` is enabled,
 * which it is not by default, so a spoofed header cannot poison audit records
 * in the default deployment.
 */
export const ClientIp = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  return request.ip ?? null;
});

export const UserAgent = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  const value = request.headers['user-agent'];
  return (Array.isArray(value) ? value[0] : value)?.slice(0, 400) ?? null;
});

export interface RequestMeta {
  requestId: string;
  ipAddress: string | null;
  userAgent: string | null;
}

/** Bundles the three audit fields into one injectable object. */
export const Meta = createParamDecorator((_data: unknown, ctx: ExecutionContext): RequestMeta => {
  const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  const ua = request.headers['user-agent'];
  return {
    requestId: request.requestId,
    ipAddress: request.ip ?? null,
    userAgent: (Array.isArray(ua) ? ua[0] : ua)?.slice(0, 400) ?? null,
  };
});

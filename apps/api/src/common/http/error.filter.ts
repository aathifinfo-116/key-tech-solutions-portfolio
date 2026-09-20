import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

interface ErrorBody {
  statusCode: number;
  error: string;
  message: string;
  requestId?: string;
  details?: Array<{ path: string; message: string }>;
}

/**
 * Converts every thrown error into a safe JSON body.
 *
 * Internal detail - stack traces, Prisma messages, SQL, file paths - is logged
 * server side and never sent to the client. Clients get a stable shape, a
 * status code and a request id they can quote to support.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpException');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest & { requestId?: string }>();
    const requestId = request?.requestId;

    const body = this.toBody(exception, requestId);

    if (body.statusCode >= 500) {
      this.logger.error(
        `${request?.method} ${request?.url} -> ${body.statusCode} [${requestId ?? '-'}]`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else if (body.statusCode !== 404) {
      this.logger.warn(
        `${request?.method} ${request?.url} -> ${body.statusCode} [${requestId ?? '-'}] ${body.message}`,
      );
    }

    void reply.status(body.statusCode).send(body);
  }

  private toBody(exception: unknown, requestId?: string): ErrorBody {
    if (exception instanceof ZodError) {
      return {
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        error: 'Unprocessable Entity',
        message: 'Validation failed.',
        requestId,
        details: exception.issues.map((issue) => ({
          path: issue.path.join('.') || '(root)',
          message: issue.message,
        })),
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      if (typeof response === 'string') {
        return { statusCode: status, error: exception.name, message: response, requestId };
      }
      const payload = response as Record<string, unknown>;
      return {
        statusCode: status,
        error: (payload.error as string) ?? exception.name,
        message: Array.isArray(payload.message)
          ? (payload.message as string[]).join(', ')
          : ((payload.message as string) ?? exception.message),
        requestId,
        details: payload.details as ErrorBody['details'],
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.fromPrisma(exception, requestId);
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      // The raw message echoes the query shape, so it is logged, not returned.
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        message: 'The request could not be processed.',
        requestId,
      };
    }

    // Fastify plugins (rate limiting, multipart, body limits) reject with a
    // plain Error carrying a statusCode. Without this, a 429 or a 413 would be
    // reported to the client as a 500, which is both wrong and unhelpful.
    const status = numericStatus(exception);
    if (status && status >= 400 && status < 600) {
      return {
        statusCode: status,
        error:
          status === 429
            ? 'Too Many Requests'
            : status === 413
              ? 'Payload Too Large'
              : 'Request Failed',
        message:
          status >= 500
            ? 'An unexpected error occurred. Quote the request id when reporting this.'
            : ((exception as Error).message ?? 'The request could not be completed.'),
        requestId,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred. Quote the request id when reporting this.',
      requestId,
    };
  }

  private fromPrisma(error: Prisma.PrismaClientKnownRequestError, requestId?: string): ErrorBody {
    switch (error.code) {
      case 'P2002': {
        const target = (error.meta?.target as string[] | string | undefined) ?? [];
        const field = Array.isArray(target) ? target.join(', ') : String(target);
        return {
          statusCode: HttpStatus.CONFLICT,
          error: 'Conflict',
          message: field
            ? `Another record already uses that ${humanise(field)}.`
            : 'Another record with these details already exists.',
          requestId,
          details: field ? [{ path: field, message: 'must be unique' }] : undefined,
        };
      }
      case 'P2025':
        return {
          statusCode: HttpStatus.NOT_FOUND,
          error: 'Not Found',
          message: 'The requested record does not exist.',
          requestId,
        };
      case 'P2003':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'Bad Request',
          message: 'A referenced record does not exist.',
          requestId,
        };
      case 'P2014':
        return {
          statusCode: HttpStatus.CONFLICT,
          error: 'Conflict',
          message: 'This record is still referenced by other content.',
          requestId,
        };
      default:
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Internal Server Error',
          message: 'A database error occurred. Quote the request id when reporting this.',
          requestId,
        };
    }
  }
}

function humanise(field: string): string {
  return field
    .replace(/_/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase();
}

/** Reads a numeric HTTP status off a non-HttpException error, if it has one. */
function numericStatus(exception: unknown): number | null {
  if (!exception || typeof exception !== 'object') return null;
  const candidate = exception as { statusCode?: unknown; status?: unknown };
  const value = typeof candidate.statusCode === 'number' ? candidate.statusCode : candidate.status;
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

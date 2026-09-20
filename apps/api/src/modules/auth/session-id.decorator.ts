import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { AuthenticatedRequest } from '../../common/http/request-context';

/** Injects the id of the session the request authenticated with. */
export const SessionIdParam = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    return ctx.switchToHttp().getRequest<AuthenticatedRequest>().sessionId ?? '';
  },
);

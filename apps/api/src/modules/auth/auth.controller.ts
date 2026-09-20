import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
} from '@kts/validation';
import type { SessionUserDto } from '@kts/shared-types';
import { Public } from '../../common/auth/auth.decorators';
import { SessionService } from '../../common/auth/session.service';
import { CurrentUser, Meta, type RequestMeta } from '../../common/http/request-context';
import { AuthService } from './auth.service';
import { SessionIdParam } from './session-id.decorator';

@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly sessions: SessionService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(
    @Body() body: unknown,
    @Meta() meta: RequestMeta,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<SessionUserDto> {
    const input = loginSchema.parse(body ?? {});
    const { session, user } = await this.auth.login(input, meta);
    this.sessions.setCookie(reply, session.token, session.expiresAt);
    return user;
  }

  @Post('logout')
  @HttpCode(204)
  async logout(
    @CurrentUser() user: SessionUserDto,
    @SessionIdParam() sessionId: string,
    @Meta() meta: RequestMeta,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<void> {
    await this.auth.logout(sessionId, { id: user.id, email: user.email }, meta);
    this.sessions.clearCookie(reply);
  }

  @Get('me')
  me(@CurrentUser() user: SessionUserDto): SessionUserDto {
    return user;
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(@Body() body: unknown, @Meta() meta: RequestMeta) {
    return this.auth.requestPasswordReset(forgotPasswordSchema.parse(body ?? {}), meta);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(@Body() body: unknown, @Meta() meta: RequestMeta) {
    return this.auth.resetPassword(resetPasswordSchema.parse(body ?? {}), meta);
  }

  @Post('change-password')
  @HttpCode(200)
  async changePassword(
    @Body() body: unknown,
    @CurrentUser() user: SessionUserDto,
    @SessionIdParam() sessionId: string,
    @Meta() meta: RequestMeta,
  ) {
    return this.auth.changePassword(
      user.id,
      sessionId,
      changePasswordSchema.parse(body ?? {}),
      meta,
    );
  }

  @Get('sessions')
  async listSessions(@CurrentUser() user: SessionUserDto, @SessionIdParam() sessionId: string) {
    return this.sessions.listForUser(user.id, sessionId);
  }

  @Delete('sessions/:id')
  @HttpCode(204)
  async revokeSession(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: SessionUserDto,
  ): Promise<void> {
    // A user may only revoke their own sessions.
    const owned = await this.sessions.listForUser(user.id, '');
    if (!owned.some((session) => session.id === id)) {
      throw new UnauthorizedException('That session does not belong to you.');
    }
    await this.sessions.revoke(id, 'revoked-by-user');
  }
}

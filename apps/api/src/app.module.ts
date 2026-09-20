import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { CommonModule } from './common/common.module';
import { SessionGuard, PermissionsGuard } from './common/auth/guards';
import { AllExceptionsFilter } from './common/http/error.filter';
import { PublicFormRateLimitGuard } from './common/http/rate-limit.guard';
import { RequestContextInterceptor } from './common/http/request-context';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { CareersModule } from './modules/careers/careers.module';
import { ContentModule } from './modules/content/content.module';
import { HealthModule } from './modules/health/health.module';
import { LeadsModule } from './modules/leads/leads.module';
import { MediaModule } from './modules/media/media.module';
import { PublicModule } from './modules/public/public.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { SeoModule } from './modules/seo/seo.module';
import { SettingsModule } from './modules/settings/settings.module';

/**
 * Guard order matters: the session is resolved first, then the per-route
 * permission check, then the public-form rate limit. Every route is protected
 * unless it opts out with `@Public()`, so a new controller fails closed.
 */
@Module({
  imports: [
    CommonModule,
    HealthModule,
    AuthModule,
    RbacModule,
    MediaModule,
    SettingsModule,
    ContentModule,
    CareersModule,
    LeadsModule,
    SeoModule,
    AdminModule,
    PublicModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: RequestContextInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: SessionGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_GUARD, useClass: PublicFormRateLimitGuard },
  ],
})
export class AppModule {}

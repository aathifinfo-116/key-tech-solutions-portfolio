import { Injectable } from '@nestjs/common';
import { apiEnvSchema, parseEnv, type ApiEnv } from '@kts/config';

/**
 * Validated application configuration.
 *
 * Parsed once at module construction. If anything is missing or malformed the
 * process refuses to start, naming the variables but never their values.
 */
@Injectable()
export class AppConfig {
  private readonly env: ApiEnv;

  constructor(source: NodeJS.ProcessEnv = process.env) {
    this.env = parseEnv(apiEnvSchema, source);

    /*
      A browser discards a SameSite=None cookie that is not also Secure, and
      says nothing about it. The result looks exactly like a session that
      expires the instant it is used, which is a miserable thing to debug -
      so refuse to start instead, naming the two variables at fault.
    */
    if (this.env.SESSION_COOKIE_SAME_SITE === 'none' && !this.env.SESSION_COOKIE_SECURE) {
      throw new Error(
        'SESSION_COOKIE_SAME_SITE=none requires SESSION_COOKIE_SECURE=true; ' +
          'browsers silently discard a cookie that is SameSite=None without Secure.',
      );
    }
  }

  get raw(): ApiEnv {
    return this.env;
  }

  get isProduction(): boolean {
    return this.env.NODE_ENV === 'production';
  }

  get isTest(): boolean {
    return this.env.NODE_ENV === 'test';
  }

  get port(): number {
    return this.env.API_PORT;
  }

  get host(): string {
    return this.env.API_HOST;
  }

  get publicApiUrl(): string {
    return this.env.API_PUBLIC_URL.replace(/\/+$/, '');
  }

  get publicSiteUrl(): string {
    return this.env.PUBLIC_SITE_URL.replace(/\/+$/, '');
  }

  get adminSiteUrl(): string {
    return this.env.ADMIN_SITE_URL.replace(/\/+$/, '');
  }

  /** Browser origins allowed to call the API, defaulting to the two apps. */
  get corsOrigins(): string[] {
    if (this.env.CORS_ORIGINS.length > 0) return this.env.CORS_ORIGINS;
    return [this.publicSiteUrl, this.adminSiteUrl];
  }

  get session() {
    return {
      secret: this.env.SESSION_SECRET,
      cookieName: this.env.SESSION_COOKIE_NAME,
      idleMinutes: this.env.SESSION_IDLE_MINUTES,
      absoluteHours: this.env.SESSION_ABSOLUTE_HOURS,
      secure: this.env.SESSION_COOKIE_SECURE,
      domain: this.env.SESSION_COOKIE_DOMAIN || undefined,
      sameSite: this.env.SESSION_COOKIE_SAME_SITE,
    };
  }

  get auth() {
    return {
      hashRounds: this.env.PASSWORD_HASH_ROUNDS,
      maxAttempts: this.env.LOGIN_MAX_ATTEMPTS,
      lockMinutes: this.env.LOGIN_LOCK_MINUTES,
      resetTokenMinutes: 30,
      inviteTokenHours: 48,
    };
  }

  get rateLimit() {
    return {
      windowSeconds: this.env.RATE_LIMIT_WINDOW_SECONDS,
      max: this.env.RATE_LIMIT_MAX,
      publicFormMax: this.env.PUBLIC_FORM_RATE_LIMIT_MAX,
      /**
       * Callers exempt from the global ceiling. Loopback is included by
       * default because a static site build issues hundreds of reads from the
       * same host in seconds, and throttling your own build is pointless.
       * Public form submissions are still limited per IP regardless.
       */
      allowList:
        this.env.RATE_LIMIT_ALLOWLIST.length > 0
          ? this.env.RATE_LIMIT_ALLOWLIST
          : ['127.0.0.1', '::1', '::ffff:127.0.0.1'],
    };
  }

  get storage() {
    return {
      driver: this.env.STORAGE_DRIVER,
      localRoot: this.env.STORAGE_LOCAL_ROOT,
      publicBaseUrl: this.env.STORAGE_PUBLIC_BASE_URL.replace(/\/+$/, ''),
      maxImageBytes: this.env.MAX_UPLOAD_IMAGE_MB * 1024 * 1024,
      maxDocumentBytes: this.env.MAX_UPLOAD_DOCUMENT_MB * 1024 * 1024,
      s3: {
        region: this.env.S3_REGION,
        bucket: this.env.S3_BUCKET,
        endpoint: this.env.S3_ENDPOINT,
        accessKeyId: this.env.S3_ACCESS_KEY_ID,
        secretAccessKey: this.env.S3_SECRET_ACCESS_KEY,
      },
    };
  }

  get mail() {
    return {
      driver: this.env.MAIL_DRIVER,
      from: this.env.MAIL_FROM,
      notifyTo: this.env.MAIL_NOTIFY_TO,
      smtp: {
        host: this.env.SMTP_HOST,
        port: this.env.SMTP_PORT,
        secure: this.env.SMTP_SECURE,
        user: this.env.SMTP_USER,
        password: this.env.SMTP_PASSWORD,
      },
    };
  }

  get revalidateSecret(): string | undefined {
    return this.env.REVALIDATE_SECRET;
  }

  get previewSecret(): string | undefined {
    return this.env.PREVIEW_SECRET;
  }

  /** Hosts an editor-created redirect is permitted to point at. */
  get allowedRedirectHosts(): string[] {
    const hosts = new Set<string>();
    for (const url of [this.publicSiteUrl, this.adminSiteUrl]) {
      try {
        hosts.add(new URL(url).host);
      } catch {
        // Ignored: validated elsewhere.
      }
    }
    return Array.from(hosts);
  }
}

export const APP_CONFIG = 'APP_CONFIG';

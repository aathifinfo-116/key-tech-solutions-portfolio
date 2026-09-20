/**
 * Environment validation.
 *
 * Every process validates its own slice of the environment at boot and fails
 * fast with a readable message. No secret is ever printed back: the error
 * lists variable *names* only.
 */

import { z } from 'zod';

const booleanish = z
  .union([z.boolean(), z.string()])
  .transform((v) =>
    typeof v === 'boolean' ? v : ['1', 'true', 'yes', 'on'].includes(v.toLowerCase()),
  );

const intFromString = (fallback: number) =>
  z
    .union([z.number(), z.string()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === '') return fallback;
      const parsed = typeof v === 'number' ? v : Number.parseInt(v, 10);
      return Number.isFinite(parsed) ? parsed : fallback;
    });

const csv = z
  .string()
  .optional()
  .transform((v) =>
    (v ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );

const postgresUrl = z
  .string()
  .min(1, 'must be set')
  .refine((v) => /^postgres(ql)?:\/\//.test(v), 'must be a postgresql:// connection string');

export const apiEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  DATABASE_URL: postgresUrl,
  DATABASE_DIRECT_URL: postgresUrl.optional(),

  API_PORT: intFromString(4000),
  API_HOST: z.string().default('0.0.0.0'),
  API_PUBLIC_URL: z.string().url().default('http://localhost:4000'),
  CORS_ORIGINS: csv,

  SESSION_SECRET: z.string().min(32, 'must be at least 32 characters'),
  SESSION_COOKIE_NAME: z.string().default('kts_admin_session'),
  SESSION_IDLE_MINUTES: intFromString(120),
  SESSION_ABSOLUTE_HOURS: intFromString(24),
  SESSION_COOKIE_SECURE: booleanish.default(false),
  SESSION_COOKIE_DOMAIN: z.string().optional(),

  PASSWORD_HASH_ROUNDS: intFromString(12),
  LOGIN_MAX_ATTEMPTS: intFromString(5),
  LOGIN_LOCK_MINUTES: intFromString(15),

  REVALIDATE_SECRET: z.string().min(16).optional(),
  PREVIEW_SECRET: z.string().min(16).optional(),

  RATE_LIMIT_WINDOW_SECONDS: intFromString(60),
  RATE_LIMIT_MAX: intFromString(600),
  PUBLIC_FORM_RATE_LIMIT_MAX: intFromString(5),
  RATE_LIMIT_ALLOWLIST: csv,

  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  STORAGE_LOCAL_ROOT: z.string().default('./uploads'),
  STORAGE_PUBLIC_BASE_URL: z.string().default('http://localhost:4000/api/v1/media/file'),
  MAX_UPLOAD_IMAGE_MB: intFromString(8),
  MAX_UPLOAD_DOCUMENT_MB: intFromString(15),

  S3_REGION: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),

  MAIL_DRIVER: z.enum(['log', 'smtp']).default('log'),
  MAIL_FROM: z.string().default('Key Tech Solutions <no-reply@example.invalid>'),
  MAIL_NOTIFY_TO: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: intFromString(587),
  SMTP_SECURE: booleanish.default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),

  PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
  ADMIN_SITE_URL: z.string().url().default('http://localhost:3001'),
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;

export const webEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_SITE_NAME: z.string().default('Key Tech Solutions'),
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:4000'),
  API_INTERNAL_URL: z.string().url().optional(),
  NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION: z.string().optional(),
  NEXT_PUBLIC_ANALYTICS_ID: z.string().optional(),
  REVALIDATE_SECRET: z.string().optional(),
  PREVIEW_SECRET: z.string().optional(),
});

export type WebEnv = z.infer<typeof webEnvSchema>;

export const adminEnvSchema = z.object({
  NEXT_PUBLIC_ADMIN_URL: z.string().url().default('http://localhost:3001'),
  NEXT_PUBLIC_ADMIN_API_URL: z.string().url().default('http://localhost:4000'),
  ADMIN_INTERNAL_API_URL: z.string().url().optional(),
});

export type AdminEnv = z.infer<typeof adminEnvSchema>;

export class EnvironmentValidationError extends Error {
  constructor(public readonly variables: string[]) {
    super(
      `Invalid or missing environment variables: ${variables.join(', ')}. ` +
        `Copy .env.example to .env and fill in the values. Values are never printed.`,
    );
    this.name = 'EnvironmentValidationError';
  }
}

/**
 * Parses `source` against `schema`. On failure the thrown error names the
 * offending variables but never echoes their values.
 */
export function parseEnv<T extends z.ZodTypeAny>(
  schema: T,
  source: NodeJS.ProcessEnv = process.env,
): z.infer<T> {
  const result = schema.safeParse(source);
  if (result.success) return result.data;
  const names = Array.from(
    new Set(
      result.error.issues.map((issue) => {
        const key = issue.path.join('.') || '(root)';
        return `${key} (${issue.message})`;
      }),
    ),
  );
  throw new EnvironmentValidationError(names);
}

/** Builds a connection string from discrete parts, URL-encoding the password. */
export function buildDatabaseUrl(parts: {
  user: string;
  password: string;
  host: string;
  port: number | string;
  database: string;
  schema?: string;
  ssl?: boolean;
}): string {
  const schema = parts.schema ?? 'public';
  const auth = `${encodeURIComponent(parts.user)}:${encodeURIComponent(parts.password)}`;
  const query = `schema=${encodeURIComponent(schema)}${parts.ssl ? '&sslmode=require' : ''}`;
  return `postgresql://${auth}@${parts.host}:${parts.port}/${encodeURIComponent(parts.database)}?${query}`;
}

/** Redacts credentials from a connection string so it is safe to log. */
export function redactConnectionString(url: string): string {
  return url.replace(/\/\/([^:@/]+):([^@/]*)@/, '//$1:***@');
}

import { describe, expect, it } from 'vitest';
import {
  EnvironmentValidationError,
  apiEnvSchema,
  buildDatabaseUrl,
  parseEnv,
  redactConnectionString,
} from './env';
import { buildCssVariables, brandColors, sectionThemeTokens } from './tokens';

const VALID_BASE = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://app_user:placeholder@localhost:5432/key-tech?schema=public',
  SESSION_SECRET: 'x'.repeat(48),
};

describe('parseEnv', () => {
  it('accepts a minimal valid environment and applies defaults', () => {
    const env = parseEnv(apiEnvSchema, VALID_BASE as unknown as NodeJS.ProcessEnv);
    expect(env.API_PORT).toBe(4010);
    expect(env.STORAGE_DRIVER).toBe('local');
    expect(env.SESSION_COOKIE_NAME).toBe('kts_admin_session');
    expect(env.CORS_ORIGINS).toEqual([]);
  });

  it('parses comma separated CORS origins', () => {
    const env = parseEnv(apiEnvSchema, {
      ...VALID_BASE,
      CORS_ORIGINS: 'http://localhost:3010, http://localhost:3011 ,',
    } as unknown as NodeJS.ProcessEnv);
    expect(env.CORS_ORIGINS).toEqual(['http://localhost:3010', 'http://localhost:3011']);
  });

  it('coerces numeric strings', () => {
    const env = parseEnv(apiEnvSchema, {
      ...VALID_BASE,
      API_PORT: '4100',
      PASSWORD_HASH_ROUNDS: '13',
    } as unknown as NodeJS.ProcessEnv);
    expect(env.API_PORT).toBe(4100);
    expect(env.PASSWORD_HASH_ROUNDS).toBe(13);
  });

  it('rejects a missing database url', () => {
    expect(() =>
      parseEnv(apiEnvSchema, {
        NODE_ENV: 'test',
        SESSION_SECRET: 'x'.repeat(48),
      } as unknown as NodeJS.ProcessEnv),
    ).toThrow(EnvironmentValidationError);
  });

  it('rejects a short session secret', () => {
    expect(() =>
      parseEnv(apiEnvSchema, {
        ...VALID_BASE,
        SESSION_SECRET: 'too-short',
      } as unknown as NodeJS.ProcessEnv),
    ).toThrow(EnvironmentValidationError);
  });

  it('never includes the offending value in the error message', () => {
    const secretValue = 'super-secret-value-that-must-not-leak';
    try {
      parseEnv(apiEnvSchema, {
        ...VALID_BASE,
        DATABASE_URL: secretValue,
      } as unknown as NodeJS.ProcessEnv);
      throw new Error('expected parseEnv to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(EnvironmentValidationError);
      expect((error as Error).message).not.toContain(secretValue);
      expect((error as Error).message).toContain('DATABASE_URL');
    }
  });
});

describe('buildDatabaseUrl', () => {
  it('url-encodes credentials containing reserved characters', () => {
    const url = buildDatabaseUrl({
      user: 'app user',
      // check-secrets-ignore: the reserved characters are what this asserts.
      password: 'p@ss:word/#1',
      host: 'localhost',
      port: 5432,
      database: 'key-tech-solutions-portfolio-management',
    });
    expect(url).toContain('app%20user');
    expect(url).toContain('p%40ss%3Aword%2F%231');
    expect(url).not.toContain('p@ss:word');
  });

  it('adds sslmode when requested', () => {
    const url = buildDatabaseUrl({
      user: 'u',
      password: 'p',
      host: 'db.internal',
      port: '5432',
      database: 'app',
      ssl: true,
    });
    expect(url).toContain('sslmode=require');
  });
});

describe('redactConnectionString', () => {
  it('masks the password', () => {
    // check-secrets-ignore: redaction cannot be proven without a password.
    const redacted = redactConnectionString('postgresql://app:hunter2@localhost:5432/app');
    expect(redacted).toBe('postgresql://app:***@localhost:5432/app');
    expect(redacted).not.toContain('hunter2');
  });
});

describe('design tokens', () => {
  it('exposes the documented brand palette', () => {
    expect(brandColors.purple).toBe('#6436A3');
    expect(brandColors.blue).toBe('#416F9E');
    expect(brandColors.teal).toBe('#2CA3A3');
    expect(brandColors.cyan).toBe('#5BC3C6');
  });

  it('defines every section theme used by the page builder', () => {
    expect(Object.keys(sectionThemeTokens).sort()).toEqual(
      ['BRAND_GRADIENT', 'DARK', 'LIGHT', 'SOFT_PURPLE', 'SOFT_TEAL', 'WHITE'].sort(),
    );
  });

  it('emits css custom properties for colours, spacing and motion', () => {
    const css = buildCssVariables();
    expect(css.startsWith(':root {')).toBe(true);
    expect(css).toContain('--kt-color-purple: #6436A3;');
    expect(css).toContain('--kt-space-4: 1rem;');
    expect(css).toContain('--kt-duration-base: 240ms;');
    expect(css).toContain(
      '--kt-gradient-brand: linear-gradient(135deg, #6436A3 0%, #416F9E 50%, #2CA3A3 100%);',
    );
  });
});

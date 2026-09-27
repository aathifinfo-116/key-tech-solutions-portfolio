import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests.
 *
 * These run against a *running* stack rather than starting one, because the
 * API, the database and both web apps are separate processes. Start them
 * first (see the README), then:
 *
 *   E2E_BASE_URL=http://localhost:3010 \
 *   E2E_ADMIN_URL=http://localhost:3011 \
 *   pnpm --filter @kts/public-web test:e2e
 *
 * Admin credentials come from E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD. Tests that
 * need them skip themselves, with a message, when they are absent - so the
 * suite is still useful without handing it a password.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  timeout: 30_000,
  expect: { timeout: 8_000 },

  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3010',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },

  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      // 390px catches the layouts that break first on a real phone.
      name: 'mobile-chromium',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'reduced-motion',
      use: { ...devices['Desktop Chrome'], reducedMotion: 'reduce' },
      testMatch: /accessibility\.spec\.ts/,
    },
  ],
});

import { defineConfig } from 'vitest/config';

/**
 * Unit tests for the website.
 *
 * The end-to-end suite under `e2e/` belongs to Playwright and needs a running
 * stack; Vitest must not try to collect it, or `pnpm test` fails on files it
 * was never meant to run. Use `pnpm test:e2e` for those.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**', '.next/**'],
  },
});

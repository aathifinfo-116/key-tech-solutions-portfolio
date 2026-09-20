/**
 * Integration tests.
 *
 * These drive the real application against a real PostgreSQL database. Set
 * TEST_DATABASE_URL (or DATABASE_URL) to a migrated, seeded database; without
 * one, `global-setup.ts` marks the run as skipped and every suite reports
 * itself as skipped rather than failing.
 *
 * Run serially: the suites share one database and several assert on rows
 * they have just written.
 */
module.exports = {
  rootDir: 'test',
  testEnvironment: 'node',
  testRegex: '.*.int-spec.ts$',
  transform: {
    '^.+.ts$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.json', isolatedModules: true }],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  globalSetup: '<rootDir>/global-setup.ts',
  testTimeout: 60000,
  maxWorkers: 1,
};

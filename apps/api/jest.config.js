/** Unit tests. No database or network access required. */
module.exports = {
  rootDir: 'src',
  testEnvironment: 'node',
  testRegex: '.*.spec.ts$',
  transform: {
    '^.+.ts$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.json', isolatedModules: true }],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: ['**/*.ts', '!**/*.spec.ts', '!main.ts', '!**/*.module.ts'],
  coverageDirectory: '../coverage',
  clearMocks: true,
};

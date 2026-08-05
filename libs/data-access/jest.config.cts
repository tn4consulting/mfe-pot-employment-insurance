module.exports = {
  displayName: 'employment-insurance-data-access',
  preset: '../../jest.preset.js',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  coverageDirectory: '../../coverage/libs/data-access',
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
  // @tn4consulting/shared-auth ships ESM-only (see CLAUDE.md's "Monorepo ->
  // per-app repos" gotcha) -- this lib's Http*ApiClient imports
  // getAccessToken from it to attach the mock-idp bearer token.
  transformIgnorePatterns: ['node_modules/(?!\\.pnpm|@tn4consulting/|.*\\.mjs$)'],
};

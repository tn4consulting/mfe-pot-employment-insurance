module.exports = {
  displayName: 'employment-insurance-data-access',
  preset: '../../jest.preset.js',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  coverageDirectory: '../../coverage/libs/data-access',
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  // @tn4consulting/shared-auth ships ESM-only (see CLAUDE.md's "Monorepo ->
  // per-app repos" gotcha) -- this lib's Http*ApiClient now imports
  // getAccessToken from it to attach the mock-idp bearer token.
  transformIgnorePatterns: ['node_modules/(?!\\.pnpm|@tn4consulting/|.*\\.mjs$)'],
  snapshotSerializers: [
    'jest-preset-angular/build/serializers/no-ng-attributes',
    'jest-preset-angular/build/serializers/ng-snapshot',
    'jest-preset-angular/build/serializers/html-comment',
  ],
};

const nxPreset = require('@nx/jest/preset').default;

module.exports = {
  ...nxPreset,
  // @angular-architects/native-federation, @softarc/native-federation,
  // @gcds-core/*, and @stencil/core (a transitive runtime dependency of
  // @tn4consulting/shared-ui-scds-core's dist-custom-elements output) ship
  // ESM-only (package.json "type": "module") even on their .js files, so
  // Jest's default node_modules exclusion can't parse them without this.
  transformIgnorePatterns: [
    'node_modules/(?!\\.pnpm|(@angular-architects|@softarc|@gcds-core|@jsverse|@stencil)/|.*\\.mjs$)',
  ],
};

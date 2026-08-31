// https://docs.expo.dev/guides/using-eslint/
const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  globalIgnores(['.expo/*', 'dist/*']),
  expoConfig,
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
    rules: {
      // React Compiler cannot currently model Reanimated shared values or
      // Gesture Handler worklets and reports their intended writes as mutations.
      'react-hooks/immutability': 'off',
      'react-hooks/refs': 'off',
      // Existing modal/state hydration effects are deliberate synchronization.
      'react-hooks/set-state-in-effect': 'off',
      // Existing seeded UI particles are intentionally generated once per mount.
      'react-hooks/purity': 'off',
      // Keep the new lint gate focused on actionable failures until the existing
      // repository-wide warning backlog is handled in a dedicated cleanup.
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react/no-unescaped-entities': 'off',
    },
  },
]);

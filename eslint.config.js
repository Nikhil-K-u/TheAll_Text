import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['js/vendor/**', 'node_modules/**', 'playwright-report/**'] },
  js.configs.recommended,
  {
    files: ['js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser }
    },
    rules: {
      'no-unused-vars': ['error', { caughtErrors: 'none' }],
      'prefer-const': 'error',
      eqeqeq: 'error'
    }
  },
  {
    files: ['tests/**/*.js', '*.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser }
    }
  }
];

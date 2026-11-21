import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  globalIgnores([
    'dist',
    'public',
    'tests/.output',
    'test-results',
    'playwright-report',
    'examples/*/public',
    'examples/mwa',
  ]),
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    // Runs in the browser
    files: ['packages/app/**', 'examples/**'],
    languageOptions: { globals: globals.browser },
  },
  {
    // Runs in Node.js
    files: ['packages/cli/**', 'tests/**', '*.{js,mjs,ts,mts}'],
    languageOptions: { globals: globals.node },
  },
  // Formatting is Prettier's job
  prettier,
);

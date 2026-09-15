import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default [
  {
    ignores: ['.wrangler/**', 'node_modules/**']
  },
  {
    name: 'fold/base',
    ...js.configs.recommended,
    rules: {
      'no-unused-vars': [
        'error',
        {
          // The codebase deliberately uses catch (e)/catch (err) with generic
          // error responses (never leaking internals) and exposes
          // FOLD_PRODUCTS/FOLD_CATEGORIES as script-level globals.
          caughtErrorsIgnorePattern: '^(e|err)$',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^FOLD_'
        }
      ]
    }
  },
  {
    name: 'fold/browser',
    files: ['script.js', 'admin.js'],
    languageOptions: {
      sourceType: 'script',
      globals: globals.browser
    }
  },
  {
    name: 'fold/storefront-data',
    files: ['data/**/*.js'],
    languageOptions: {
      sourceType: 'script',
      globals: globals.browser
    }
  },
  {
    name: 'fold/node-tooling',
    files: ['scripts/**/*.js', 'test/**/*.js'],
    languageOptions: {
      sourceType: 'module',
      globals: globals.node
    }
  },
  {
    name: 'fold/cloudflare-functions',
    files: ['functions/**/*.js'],
    languageOptions: {
      sourceType: 'module',
      globals: {
        ...globals.worker,
        ...globals.node
      }
    }
  },
  prettier
];

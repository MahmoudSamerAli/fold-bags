// Shared helper: loads the product catalog the same way the seed generator
// does (vm sandbox), regardless of how the test file itself is loaded.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createContext, runInContext } from 'node:vm';

const root = resolve(import.meta.dirname, '..');

export function load() {
  const src = readFileSync(resolve(root, 'data', 'products.js'), 'utf8');
  const ctx = createContext({});
  runInContext(src + '\n;globalThis.__cap = FOLD_PRODUCTS;', ctx);
  return runInContext('globalThis.__cap', ctx);
}

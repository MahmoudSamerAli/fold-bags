// Fold — product seed generator.
// Usage: node scripts/seed-products-generate.js [output-file]
// Reads data/products.js and writes migrations/0003_seed_products.sql by
// default (insert-or-replace statements so it can be re-run safely), or the
// file given as the first argument.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createContext, runInContext } from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(resolve(root, 'data', 'products.js'), 'utf8');

// Evaluate the file in a sandbox and capture FOLD_PRODUCTS on globalThis.
const ctx = createContext({});
runInContext(src + '\n;globalThis.__cap = FOLD_PRODUCTS;', ctx);
const products = runInContext('globalThis.__cap', ctx);

// Build SQL (INSERT OR REPLACE keyed by id).
const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";
const lines = ['-- Fold — seed products from data/products.js (INSERT OR REPLACE)', ''];
for (const p of products) {
  const colors = q(JSON.stringify(p.colors || []));
  const sizes = q(JSON.stringify(p.sizes || ['OS']));
  const images = q(JSON.stringify(p.images || [p.image]));
  lines.push(
    `INSERT OR REPLACE INTO products (id, name, brand, category, price, old_price, image, images, colors, sizes, stock, description, active) VALUES (` +
      `${Number(p.id)}, ${q(p.name)}, ${q(p.brand || '')}, ${q(p.category)}, ${Number(p.price)}, ` +
      `${p.old_price == null ? 'NULL' : Number(p.old_price)}, ${q(p.image || '')}, ${images}, ${colors}, ${sizes}, ` +
      `${Number(p.stock) || 0}, ${q(p.description || '')}, 1);`
  );
}

const out = resolve(process.argv[2] || resolve(root, 'migrations', '0003_seed_products.sql'));
writeFileSync(out, lines.join('\n') + '\n');
console.log(`Wrote ${products.length} product rows to ${out}`);

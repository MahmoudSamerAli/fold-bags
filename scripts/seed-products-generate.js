// Fold — product seed generator.
// Usage: node scripts/seed-products-generate.js
// Reads data/products.js and writes migrations/0003_seed_products.sql
// (insert-or-replace statements so it can be re-run safely).
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'data', 'products.js'), 'utf8');

// Evaluate the file in a sandbox and capture FOLD_PRODUCTS on globalThis.
const ctx = vm.createContext({});
vm.runInContext(src + '\n;globalThis.__cap = FOLD_PRODUCTS;', ctx);
const products = vm.runInContext('globalThis.__cap', ctx);

// Build SQL (INSERT OR REPLACE keyed by id).
const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";
const lines = [
  '-- Fold — seed products from data/products.js (INSERT OR REPLACE)',
  ''
];
for (const p of products) {
  const colors = q(JSON.stringify(p.colors || []));
  const sizes = q(JSON.stringify(p.sizes || ['OS']));
  lines.push(
    `INSERT OR REPLACE INTO products (id, name, brand, category, price, old_price, image, colors, sizes, stock, description, active) VALUES (` +
    `${Number(p.id)}, ${q(p.name)}, ${q(p.brand || '')}, ${q(p.category)}, ${Number(p.price)}, ` +
    `${p.old_price == null ? 'NULL' : Number(p.old_price)}, ${q(p.image || '')}, ${colors}, ${sizes}, ` +
    `${Number(p.stock) || 0}, ${q(p.description || '')}, 1);`
  );
}

fs.writeFileSync(path.join(root, 'migrations', '0003_seed_products.sql'), lines.join('\n') + '\n');
console.log(`Wrote ${products.length} product rows to migrations/0003_seed_products.sql`);

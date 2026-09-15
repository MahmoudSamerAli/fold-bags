// Tests for the seed SQL generator (scripts/seed-products-generate.js).
// The generator is invoked with an explicit output path so the committed
// migration file is never modified by the test run.
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { before, test } from 'node:test';
import assert from 'node:assert/strict';

import { load } from './_load-products.js';

const root = resolve(import.meta.dirname, '..');
const products = load();
const tmpDir = mkdtempSync(join(tmpdir(), 'fold-seed-'));
const outFile = join(tmpDir, '0003_seed_products.sql');

let stdout = '';
let stderr = '';

before(() => {
  const result = spawnSync(
    process.execPath,
    [resolve(root, 'scripts', 'seed-products-generate.js'), outFile],
    { encoding: 'utf8', cwd: root }
  );
  stdout = result.stdout || '';
  stderr = result.stderr || '';
  assert.equal(result.status, 0, `generator failed:\n${stderr}`);
});

test('writes a seed file and reports the row count', () => {
  assert.match(stdout, new RegExp(`Wrote ${products.length} product rows`));
});

test('generates one INSERT OR REPLACE per product', () => {
  const sql = readFileSync(outFile, 'utf8');
  const inserts = sql.match(/^INSERT OR REPLACE INTO products /gm) || [];
  assert.equal(inserts.length, products.length);
});

test('every product id is present as an explicit id value', () => {
  const sql = readFileSync(outFile, 'utf8');
  const idsInSql = [...sql.matchAll(/VALUES\s*\(\s*(\d+),/g)].map((m) => Number(m[1]));
  const sorted = (xs) => [...xs].sort((a, b) => a - b);
  assert.deepEqual(sorted(idsInSql), sorted(products.map((p) => p.id)));
});

test('escapes single quotes in text values (apostrophes)', () => {
  const sql = readFileSync(outFile, 'utf8');
  const withQuote = products.find((p) => p.name.includes("'"));
  if (withQuote) {
    assert.ok(sql.includes(withQuote.name.replace(/'/g, "''")), 'apostrophe not escaped');
  } else {
    assert.ok(true, 'no product names contain apostrophes; nothing to escape');
  }
});

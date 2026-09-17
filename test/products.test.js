// Tests for the static product catalog (data/products.js).
// The catalog is loaded the same way the seed generator loads it (vm sandbox),
// and is used at runtime as the offline fallback by the browser storefront.
import { readFileSync } from 'node:fs';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { createContext, runInContext } from 'node:vm';
import assert from 'node:assert/strict';

const root = process.cwd();
const src = readFileSync(join(root, 'data', 'products.js'), 'utf8');
const ctx = createContext({});
runInContext(src + '\n;globalThis.__p = FOLD_PRODUCTS; globalThis.__c = FOLD_CATEGORIES;', ctx);
const products = runInContext('globalThis.__p', ctx);
const categories = runInContext('globalThis.__c', ctx);

const VALID_CATEGORIES = new Set(['backpacks', 'totes', 'crossbody']);

test('catalog loads at least one product', () => {
  assert.ok(products.length > 0, 'expected a non-empty catalog');
});

test('product ids are unique and strictly positive integers', () => {
  assert.equal(new Set(products.map((p) => p.id)).size, products.length, 'ids must be unique');
  for (const p of products) {
    assert.ok(Number.isInteger(p.id) && p.id > 0, `id ${p.id} must be a positive integer`);
  }
});

test('every product has required string fields', () => {
  for (const p of products) {
    for (const field of ['name', 'brand', 'category', 'image', 'description']) {
      assert.equal(typeof p[field], 'string', `${p.id} ${field} must be a string`);
      assert.ok(p[field].trim().length > 0, `${p.id} ${field} must not be empty`);
    }
  }
});

test('categories are valid (backpacks | totes | crossbody)', () => {
  for (const p of products) {
    assert.ok(VALID_CATEGORIES.has(p.category), `${p.id} has invalid category "${p.category}"`);
  }
});

test('prices are positive numbers in EGP', () => {
  for (const p of products) {
    assert.equal(typeof p.price, 'number', `${p.id} price must be a number`);
    assert.ok(Number.isInteger(p.price) && p.price > 0, `${p.id} price must be a positive integer`);
  }
});

test('stock is a non-negative number', () => {
  for (const p of products) {
    assert.equal(typeof p.stock, 'number', `${p.id} stock must be a number`);
    assert.ok(Number.isInteger(p.stock) && p.stock >= 0, `${p.id} stock must be >= 0`);
  }
});

test('every product has at least one color and a valid hex', () => {
  for (const p of products) {
    assert.ok(Array.isArray(p.colors) && p.colors.length > 0, `${p.id} needs at least one color`);
    for (const c of p.colors) {
      assert.equal(typeof c.name, 'string');
      assert.ok(c.name.trim().length > 0, `${p.id} color needs a name`);
      assert.match(
        c.hex,
        /^#[0-9a-fA-F]{3,8}$/,
        `${p.id} color "${c.name}" has invalid hex "${c.hex}"`
      );
    }
  }
});

test('every product has at least one size', () => {
  for (const p of products) {
    assert.ok(Array.isArray(p.sizes) && p.sizes.length > 0, `${p.id} needs at least one size`);
    for (const s of p.sizes) {
      assert.equal(typeof s, 'string');
      assert.ok(s.trim().length > 0, `${p.id} has an empty size`);
    }
  }
});

test('every product image file exists on disk', () => {
  for (const p of products) {
    assert.ok(existsSync(join(root, p.image)), `${p.id} image missing on disk: ${p.image}`);
  }
});

test('every product images[] entries exist on disk', () => {
  for (const p of products) {
    const gallery = Array.isArray(p.images) && p.images.length ? p.images : [p.image];
    for (const img of gallery) {
      assert.ok(existsSync(join(root, img)), `${p.id} gallery image missing on disk: ${img}`);
    }
  }
});

test('category list includes all product categories and "all"', () => {
  const slugs = new Set(categories.map((c) => c.slug));
  assert.ok(slugs.has('all'), 'category list must include an "all" entry');
  for (const p of products) {
    assert.ok(
      slugs.has(p.category),
      `catalog uses category "${p.category}" not in FOLD_CATEGORIES`
    );
  }
});

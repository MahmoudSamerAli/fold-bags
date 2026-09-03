// Fold — admin products.
// GET  /api/admin/products   -> all products (including inactive)
// POST /api/admin/products   -> create a product
// All admin routes require a valid bearer session token.

import { json, requireAuth } from '../../_lib/auth.js';

export async function onRequest(context) {
  const authError = await requireAuth(context);
  if (authError) return authError;

  const { request } = context;
  if (request.method === 'GET') return listProducts(context);
  if (request.method === 'POST') return createProduct(request, context);
  return json({ error: 'Method not allowed' }, 405);
}

async function listProducts(context) {
  try {
    const { results } = await context.env.DB
      .prepare(`SELECT * FROM products ORDER BY id ASC`)
      .all();
    const rows = (results || []).map((r) => ({ ...r, colors: safeArr(r.colors), sizes: safeArr(r.sizes) }));
    return json({ products: rows });
  } catch (e) {
    return json({ error: 'Could not read products' }, 500);
  }
}

const CATEGORIES = ['crossbody', 'totes', 'backpacks'];

async function createProduct(request, context) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const name = (body.name || '').toString().trim();
  const brand = (body.brand || '').toString().trim();
  const category = (body.category || '').toString().trim() || 'crossbody';
  const price = Math.max(0, Number(body.price) || 0);
  const oldPrice = body.old_price === null || body.old_price === undefined ? null : Math.max(0, Number(body.old_price) || 0);
  const image = (body.image || '').toString().trim();
  const stock = Math.max(0, Number(body.stock) || 0);
  const description = (body.description || '').toString().trim();
  const colors = Array.isArray(body.colors) ? body.colors : [{ name: 'Default', hex: '#111111' }];
  const sizes = Array.isArray(body.sizes) && body.sizes.length ? body.sizes : ['OS'];

  if (!name || !CATEGORIES.includes(category)) {
    return json({ error: 'Name and a valid category are required' }, 400);
  }

  try {
    const result = await context.env.DB.prepare(
      `INSERT INTO products (name, brand, category, price, old_price, image, colors, sizes, stock, description, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
    ).bind(name, brand, category, price, oldPrice, image, JSON.stringify(colors), JSON.stringify(sizes), stock, description).run();

    const id = result.meta.last_row_id;
    return json({ success: true, id, sold_out: false, active: true }, 201);
  } catch (e) {
    return json({ error: 'Could not create product' }, 500);
  }
}

function safeArr(v) {
  try {
    const parsed = typeof v === 'string' ? JSON.parse(v) : v;
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

// Fold — single product admin ops.
// PATCH  /api/admin/products/:id   -> update product fields / active toggle
// DELETE /api/admin/products/:id   -> soft delete (active = 0)
// Requires a valid bearer session token.

import { json, requireAuth } from '../../_lib/auth.js';

const EDITABLE = ['name', 'brand', 'category', 'price', 'old_price', 'image', 'colors', 'sizes', 'stock', 'description', 'active'];
const CATEGORIES = ['crossbody', 'totes', 'backpacks'];

export async function onRequest(context) {
  const authError = await requireAuth(context);
  if (authError) return authError;

  const { request, env, params } = context;
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return json({ error: 'Invalid product id' }, 400);

  if (request.method === 'PATCH') return updateProduct(request, env, id);
  if (request.method === 'DELETE') return softDelete(env, id);
  return json({ error: 'Method not allowed' }, 405);
}

async function updateProduct(request, env, id) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const sets = [];
  const bind = [];

  for (const key of Object.keys(body)) {
    if (!EDITABLE.includes(key)) continue;
    let value = body[key];
    if (key === 'price' || key === 'old_price') {
      value = value === null || value === undefined ? null : Math.max(0, Number(value) || 0);
    } else if (key === 'stock') {
      value = Math.max(0, Number(value) || 0);
    } else if (key === 'active') {
      value = value ? 1 : 0;
    } else if (key === 'colors' || key === 'sizes') {
      value = JSON.stringify(Array.isArray(value) ? value : []);
    } else if (key === 'category') {
      if (!CATEGORIES.includes(value)) return json({ error: 'Invalid category' }, 400);
    } else {
      value = (value ?? '').toString();
    }
    sets.push(`${key} = ?`);
    bind.push(value);
  }

  if (!sets.length) return json({ error: 'Nothing to update' }, 400);
  bind.push(id);

  try {
    const result = await env.DB.prepare(`UPDATE products SET ${sets.join(', ')} WHERE id = ?`).bind(...bind).run();
    if (result.meta.changes === 0) return json({ error: 'Product not found' }, 404);
    return json({ success: true });
  } catch (e) {
    return json({ error: 'Could not update product' }, 500);
  }
}

async function softDelete(env, id) {
  try {
    const result = await env.DB.prepare('UPDATE products SET active = 0 WHERE id = ?').bind(id).run();
    if (result.meta.changes === 0) return json({ error: 'Product not found' }, 404);
    return json({ success: true });
  } catch (e) {
    return json({ error: 'Could not delete product' }, 500);
  }
}

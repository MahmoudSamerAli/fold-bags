// Fold — GET /api/products
// Public: returns all active products for the storefront.
// Replaces the static data/products.js as the source of truth.

import { json } from '../_lib/auth.js';

export async function onRequest(context) {
  const { request } = context;
  if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);

  try {
    const { results } = await context.env.DB
      .prepare(`SELECT id, name, brand, category, price, old_price, image, colors, sizes, stock, description FROM products WHERE active = 1 ORDER BY id ASC`)
      .all();

    const products = (results || []).map((r) => ({
      id: r.id,
      name: r.name,
      brand: r.brand,
      category: r.category,
      price: r.price,
      old_price: r.old_price,
      image: r.image,
      colors: safeArr(r.colors),
      sizes: safeArr(r.sizes),
      stock: r.stock,
      description: r.description
    }));

    return json({ products });
  } catch (e) {
    return json({ error: 'Could not read products' }, 500);
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

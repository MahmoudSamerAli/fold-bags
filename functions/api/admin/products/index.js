import { getRows, appendRow, json, error } from '../../../_lib/sheets.js';

export async function onRequest(context) {
  if (context.request.method !== 'POST') return error('Method not allowed', 405);
  try {
    const body = await context.request.json();
    const rows = await getRows(context.env, 'Products');
    const maxId = rows.reduce((max, r) => Math.max(max, Number(r.id) || 0), 0);
    const now = new Date().toISOString();
    await appendRow(context.env, 'Products', {
      id: String(maxId + 1),
      name: body.name || '',
      category: body.category || '',
      price: String(body.price || 0),
      description: body.description || '',
      image: body.image || '',
      images: JSON.stringify(body.images || []),
      colors: JSON.stringify(body.colors || []),
      sizes: JSON.stringify(body.sizes || []),
      stock: String(body.stock ?? 0),
      created_at: now,
      updated_at: now,
    });
    return json({ success: true, id: String(maxId + 1) }, 201);
  } catch (err) {
    console.error('Create product error:', err);
    return error('Server error', 500);
  }
}

import { getRows, updateRow, deleteRow, json, error } from '../../../_lib/sheets.js';

export async function onRequest(context) {
  const { request, env, params } = context;
  const id = params.id;
  if (!id) return error('Missing product ID');
  try {
    if (request.method === 'PUT') return handleUpdate(request, env, id);
    if (request.method === 'DELETE') return handleDelete(env, id);
    return error('Method not allowed', 405);
  } catch (err) {
    console.error('Product operation error:', err);
    return error('Server error', 500);
  }
}

async function handleUpdate(request, env, id) {
  const rows = await getRows(env, 'Products');
  const row = rows.find(r => String(r.id) === id);
  if (!row) return error('Product not found', 404);
  const body = await request.json();
  const now = new Date().toISOString();
  await updateRow(env, 'Products', row._row, {
    id: row.id,
    name: body.name ?? row.name,
    category: body.category ?? row.category,
    price: String(body.price ?? row.price),
    description: body.description ?? row.description,
    image: body.image ?? row.image,
    images: body.images ? JSON.stringify(body.images) : row.images,
    colors: body.colors ? JSON.stringify(body.colors) : row.colors,
    sizes: body.sizes ? JSON.stringify(body.sizes) : row.sizes,
    stock: body.stock !== undefined ? String(body.stock) : row.stock,
    created_at: row.created_at,
    updated_at: now,
  });
  return json({ success: true });
}

async function handleDelete(env, id) {
  const rows = await getRows(env, 'Products');
  const row = rows.find(r => String(r.id) === id);
  if (!row) return error('Product not found', 404);
  await deleteRow(env, 'Products', row._row);
  return json({ success: true });
}

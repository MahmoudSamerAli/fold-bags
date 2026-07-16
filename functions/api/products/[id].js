import { getRows, updateRow, deleteRow } from '../../_lib/sheets.js';
import { requireAdmin, json, error } from '../../_lib/auth.js';

export async function onRequest(context) {
  const { request, env, params } = context;
  const id = params.id;
  if (!id) return error('Missing product ID');
  if (request.method === 'GET') return handleGet(env, id);
  if (request.method === 'PUT') return handlePut(request, env, id);
  if (request.method === 'DELETE') return handleDelete(request, env, id);
  return error('Method not allowed', 405);
}

async function handleGet(env, id) {
  const rows = await getRows(env, 'Products');
  const row = rows.find(r => String(r.id) === id);
  if (!row) return error('Product not found', 404);
  return json(row);
}

async function handlePut(request, env, id) {
  const admin = await requireAdmin(request, env);
  if (!admin) return error('Unauthorized', 401);
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
    created_at: row.created_at,
    updated_at: now,
  });
  return json({ success: true });
}

async function handleDelete(request, env, id) {
  const admin = await requireAdmin(request, env);
  if (!admin) return error('Unauthorized', 401);
  const rows = await getRows(env, 'Products');
  const row = rows.find(r => String(r.id) === id);
  if (!row) return error('Product not found', 404);
  await deleteRow(env, 'Products', row._row);
  return json({ success: true });
}

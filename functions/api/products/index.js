import { getRows, appendRow } from '../../_lib/sheets.js';
import { requireAdmin, json, error } from '../../_lib/auth.js';

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'GET') return handleGet(env);
  if (request.method === 'POST') return handlePost(request, env);
  return error('Method not allowed', 405);
}

async function handleGet(env) {
  const rows = await getRows(env, 'Products');
  return json(rows);
}

async function handlePost(request, env) {
  const admin = await requireAdmin(request, env);
  if (!admin) return error('Unauthorized', 401);
  const body = await request.json();
  const rows = await getRows(env, 'Products');
  const maxId = rows.reduce((max, r) => Math.max(max, Number(r.id) || 0), 0);
  const now = new Date().toISOString();
  await appendRow(env, 'Products', {
    id: String(maxId + 1),
    name: body.name || '',
    category: body.category || '',
    price: String(body.price || 0),
    description: body.description || '',
    image: body.image || '',
    images: JSON.stringify(body.images || []),
    colors: JSON.stringify(body.colors || []),
    sizes: JSON.stringify(body.sizes || []),
    created_at: now,
    updated_at: now,
  });
  return json({ success: true, id: String(maxId + 1) }, 201);
}

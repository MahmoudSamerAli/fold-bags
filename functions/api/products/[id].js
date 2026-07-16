import { getRows, json, error } from '../../_lib/sheets.js';

export async function onRequest(context) {
  const { request, env, params } = context;
  const id = params.id;
  if (!id) return error('Missing product ID');
  if (request.method === 'GET') return handleGet(env, id);
  return error('Method not allowed', 405);
}

async function handleGet(env, id) {
  const rows = await getRows(env, 'Products');
  const row = rows.find(r => String(r.id) === id);
  if (!row) return error('Product not found', 404);
  return json(row);
}

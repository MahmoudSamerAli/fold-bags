import { getRows, updateRow } from '../../_lib/sheets.js';
import { requireAdmin, json, error } from '../../_lib/auth.js';

export async function onRequest(context) {
  const { request, env, params } = context;
  const id = params.id;
  if (!id) return error('Missing order ID');
  if (request.method === 'PATCH') return handlePatch(request, env, id);
  return error('Method not allowed', 405);
}

async function handlePatch(request, env, id) {
  const admin = await requireAdmin(request, env);
  if (!admin) return error('Unauthorized', 401);
  const { status } = await request.json();
  const valid = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  if (!valid.includes(status)) return error('Invalid status');
  const rows = await getRows(env, 'Orders');
  const row = rows.find(r => String(r.id) === id || r.order_id === id);
  if (!row) return error('Order not found', 404);
  const data = { ...row, status, updated_at: new Date().toISOString() };
  delete data._row;
  await updateRow(env, 'Orders', row._row, data);
  return json({ success: true });
}

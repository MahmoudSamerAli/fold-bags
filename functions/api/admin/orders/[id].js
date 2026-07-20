import { getRows, updateRow, json, error } from '../../../_lib/sheets.js';

export async function onRequest(context) {
  const { request, env, params } = context;
  if (request.method !== 'PATCH') return error('Method not allowed', 405);
  const id = params.id;
  if (!id) return error('Missing order ID');
  try {
    const { status } = await request.json();
    const valid = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!valid.includes(status)) return error('Invalid status', 400);
    const rows = await getRows(env, 'Orders');
    const row = rows.find(r => String(r.id) === id || r.order_id === id);
    if (!row) return error('Order not found', 404);
    const data = { ...row, status, updated_at: new Date().toISOString() };
    delete data._row;
    await updateRow(env, 'Orders', row._row, data);
    return json({ success: true });
  } catch (err) {
    console.error('Update order error:', err);
    return error('Server error', 500);
  }
}

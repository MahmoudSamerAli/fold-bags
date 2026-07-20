import { getRows, json, error } from '../../../_lib/sheets.js';

export async function onRequest(context) {
  if (context.request.method !== 'GET') return error('Method not allowed', 405);
  try {
    const rows = await getRows(context.env, 'Orders');
    return json(rows);
  } catch (err) {
    console.error('List orders error:', err);
    return error('Server error', 500);
  }
}

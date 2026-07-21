import { getRows, appendRow, updateRow, json, error } from '../../_lib/sheets.js';

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'POST') return handlePost(request, env);
  return error('Method not allowed', 405);
}

async function handlePost(request, env) {
  const body = await request.json();
  const rows = await getRows(env, 'Orders');
  const maxId = rows.reduce((max, r) => Math.max(max, Number(r.id) || 0), 0);
  const now = new Date().toISOString();
  await appendRow(env, 'Orders', {
    id: String(maxId + 1),
    order_id: body.order_id || '',
    customer_name: body.customer_name || '',
    customer_phone: body.customer_phone || '',
    city: body.city || '',
    address: body.address || '',
    payment_method: body.payment_method || '',
    items: typeof body.items === 'string' ? body.items : JSON.stringify(body.items || []),
    subtotal: String(body.subtotal || 0),
    shipping: String(body.shipping || 0),
    total: String(body.total || 0),
    status: 'pending',
    created_at: now,
    updated_at: now,
  });

  const items = typeof body.items === 'string' ? JSON.parse(body.items) : (body.items || []);
  if (items.length > 0) {
    const products = await getRows(env, 'Products');
    for (const item of items) {
      const product = products.find(p => String(p.id) === String(item.id));
      if (product && product.stock !== undefined) {
        const currentStock = Number(product.stock) || 0;
        const newStock = Math.max(0, currentStock - (item.qty || 1));
        const data = { ...product, stock: String(newStock), updated_at: new Date().toISOString() };
        delete data._row;
        await updateRow(env, 'Products', product._row, data);
      }
    }
  }

  return json({ success: true, order_id: body.order_id }, 201);
}

// Fold — POST /api/orders
// Stores a Cash on Delivery order in Cloudflare D1.
export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'GET') return getOrders(env);
  if (request.method === 'POST') return createOrder(request, env);

  return json({ error: 'Method not allowed' }, 405);
}

async function createOrder(request, env) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const orderId = (body.order_id || '').toString().trim();
  const name = (body.customer_name || '').toString().trim();
  const phone = (body.customer_phone || '').toString().trim();
  const city = (body.city || '').toString().trim();
  const address = (body.address || '').toString().trim();

  if (!orderId || !name || !phone || !address) {
    return json({ error: 'Missing required fields' }, 400);
  }

  const items = Array.isArray(body.items) ? body.items : [];
  const subtotal = Number(body.subtotal) || 0;
  const shipping = Number(body.shipping) || 0;
  const total = Number(body.total) || 0;

  try {
    await env.DB.prepare(
      `INSERT INTO orders (order_id, customer_name, customer_phone, city, address, payment_method, items, subtotal, shipping, total, status)
       VALUES (?, ?, ?, ?, ?, 'cod', ?, ?, ?, ?, 'pending')`
    )
      .bind(orderId, name, phone, city, address, JSON.stringify(items), subtotal, shipping, total)
      .run();

    return json({ success: true, order_id: orderId }, 201);
  } catch (err) {
    return json({ error: 'Could not save order' }, 500);
  }
}

async function getOrders(env) {
  try {
    const { results } = await env.DB
      .prepare(`SELECT * FROM orders ORDER BY created_at DESC LIMIT 100`)
      .all();
    return json(results || []);
  } catch (err) {
    return json({ error: 'Could not read orders' }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

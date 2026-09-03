// Fold — POST /api/orders
// Stores a Cash on Delivery order in Cloudflare D1.
// The server is authoritative for prices, stock, and totals: client-supplied
// item prices and subtotal/shipping/total are ignored and recomputed here.
import { json } from '../_lib/auth.js';

const FREE_SHIPPING_MIN = 1000;
const SHIPPING_FEE = 50;
// D3: minimum seconds between orders placed from the same phone number.
const ORDER_COOLDOWN_SECONDS = 60;

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

  // Normalize the phone for matching records (order inserts in script.js).
  const phoneKey = phone.startsWith('+') ? phone.slice(1) : phone;

  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) {
    return json({ error: 'Order must contain at least one item' }, 400);
  }

  try {
    // D3: per-phone cooldown guard against rapid-fire submissions.
    const { results: recent } = await env.DB.prepare(
      `SELECT created_at FROM orders
       WHERE replace(customer_phone, '+', '') = ?
       ORDER BY created_at DESC LIMIT 1`
    ).bind(phoneKey).all();

    if (recent && recent.length) {
      const last = new Date(recent[0].created_at + 'Z').getTime();
      const elapsed = (Date.now() - last) / 1000;
      if (!Number.isNaN(last) && elapsed < ORDER_COOLDOWN_SECONDS) {
        return json(
          { error: 'Too many orders from this number. Please try again shortly.' },
          429
        );
      }
    }

    // D4: validate items against the live catalog and recompute prices server-side.
    const ids = items.map((it) => it.id).filter((id) => id != null);
    const placeholders = ids.map(() => '?').join(',');
    const { results: products } = await env.DB.prepare(
      `SELECT id, price, stock, active FROM products WHERE id IN (${placeholders}) AND active = 1`
    ).bind(...ids).all();

    const byId = Object.create(null);
    for (const p of products) byId[p.id] = p;

    const resolved = [];
    let subtotal = 0;

    for (const item of items) {
      const product = byId[item.id];
      if (!product) {
        return json({ error: `One of the selected products is unavailable`, order_id: orderId }, 400);
      }
      const qty = Number(item.qty);
      if (!Number.isInteger(qty) || qty <= 0) {
        return json({ error: 'Invalid item quantity', order_id: orderId }, 400);
      }
      if (product.stock - qty < 0) {
        return json({ error: 'One of the products is out of stock', order_id: orderId }, 409);
      }
      resolved.push({
        id: product.id,
        name: (item.name || '').toString(),
        price: product.price,
        color: (item.color || '').toString(),
        size: (item.size || '').toString(),
        qty
      });
      subtotal += product.price * qty;
    }

    const shipping = subtotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING_FEE;
    const total = subtotal + shipping;

    await env.DB.prepare(
      `INSERT INTO orders (order_id, customer_name, customer_phone, city, address, payment_method, items, subtotal, shipping, total, status)
       VALUES (?, ?, ?, ?, ?, 'cod', ?, ?, ?, ?, 'pending')`
    )
      .bind(orderId, name, phone, city, address, JSON.stringify(resolved), subtotal, shipping, total)
      .run();

    const stmts = resolved.map((item) =>
      env.DB.prepare('UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?')
        .bind(item.qty, item.id)
    );
    await env.DB.batch(stmts);

    return json(
      { success: true, order_id: orderId, subtotal, shipping, total },
      201
    );
  } catch (err) {
    return json({ error: 'Could not save order' }, 500);
  }
}

async function getOrders(env) {
  try {
    const { results } = await env.DB
      .prepare(`SELECT order_id, customer_name, customer_phone, city, address, payment_method, items, subtotal, shipping, total, status, created_at, updated_at FROM orders ORDER BY created_at DESC LIMIT 100`)
      .all();
    return json(results || []);
  } catch (err) {
    return json({ error: 'Could not read orders' }, 500);
  }
}

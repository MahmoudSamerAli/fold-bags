// Fold — admin orders.
// GET  /api/admin/orders            -> list orders (paged, filterable)
// PATCH /api/admin/orders/status    -> update status / payment_status on an order
// All admin routes require a valid bearer session token.

import { json, requireAuth } from '../../_lib/auth.js';

export async function onRequest(context) {
  const authError = await requireAuth(context);
  if (authError) return authError;

  const { request } = context;
  if (request.method === 'GET') return listOrders(request, context);
  if (request.method === 'PATCH') return updateStatus(request, context);
  return json({ error: 'Method not allowed' }, 405);
}

async function listOrders(request, context) {
  const url = new URL(request.url);
  const status = url.searchParams.get('status') || '';
  const payment = url.searchParams.get('payment') || '';
  const q = (url.searchParams.get('q') || '').toString().trim();
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1);
  const per = Math.min(100, Math.max(1, parseInt(url.searchParams.get('per') || '50', 10) || 50));
  const offset = (page - 1) * per;

  const where = [];
  const bind = [];
  if (status) { where.push('status = ?'); bind.push(status); }
  if (payment) { where.push('payment_status = ?'); bind.push(payment); }
  if (q) {
    where.push('(customer_name LIKE ? OR customer_phone LIKE ? OR order_id LIKE ?)');
    const like = `%${q}%`;
    bind.push(like, like, like);
  }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';

  try {
    const countRow = await context.env.DB.prepare(
      `SELECT COUNT(*) AS total FROM orders ${whereSql}`
    ).bind(...bind).first();
    const results = await context.env.DB.prepare(
      `SELECT * FROM orders ${whereSql} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`
    ).bind(...bind, per, offset).all();

    let stats = { paid: 0, unpaid: 0, refunded: 0, outstanding: 0 };
    try {
      const statsRow = await context.env.DB.prepare(
        `SELECT payment_status, COUNT(*) AS cnt, SUM(total) AS sum_total FROM orders ${whereSql} GROUP BY payment_status`
      ).bind(...bind).all();
      for (const row of (statsRow.results || [])) {
        if (row.payment_status in stats) stats[row.payment_status] = row.cnt;
        if (row.payment_status !== 'paid' && row.payment_status !== 'refunded') stats.outstanding += (Number(row.sum_total) || 0);
      }
    } catch (e) { /* stats query failed — fall back to zeros */ }

    const rows = (results.results || []).map((r) => ({
      ...r,
      items: safeJson(r.items),
      colors: safeJson(r.colors),
      sizes: safeJson(r.sizes)
    }));

    return json({ orders: rows, total: countRow ? countRow.total : 0, stats, page, per });
  } catch (e) {
    return json({ error: 'Could not read orders' }, 500);
  }
}

const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const PAYMENTS = ['unpaid', 'paid', 'refunded'];

async function updateStatus(request, context) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const orderId = (body.order_id || '').toString().trim();
  if (!orderId) return json({ error: 'Missing order_id' }, 400);

  const sets = [];
  const bind = [];
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) return json({ error: 'Invalid status' }, 400);
    sets.push('status = ?'); bind.push(body.status);
  }
  if (body.payment_status !== undefined) {
    if (!PAYMENTS.includes(body.payment_status)) return json({ error: 'Invalid payment_status' }, 400);
    sets.push('payment_status = ?'); bind.push(body.payment_status);
  }
  if (!sets.length) return json({ error: 'Nothing to update' }, 400);

  bind.push(orderId);
  try {
    const result = await context.env.DB.prepare(
      `UPDATE orders SET ${sets.join(', ')} WHERE order_id = ?`
    ).bind(...bind).run();

    if (result.meta.changes === 0) return json({ error: 'Order not found' }, 404);

    if (body.status === 'cancelled') {
      await restoreStock(context.env, orderId);
    }

    return json({ success: true });
  } catch (e) {
    return json({ error: 'Could not update order' }, 500);
  }
}

async function restoreStock(env, orderId) {
  try {
    const order = await env.DB.prepare('SELECT items FROM orders WHERE order_id = ?').bind(orderId).first();
    const items = safeJson(order ? order.items : '[]');
    if (!Array.isArray(items) || !items.length) return;
    const stmts = items
      .filter((item) => item && item.id != null)
      .map((item) =>
        env.DB.prepare('UPDATE products SET stock = stock + ? WHERE id = ?')
          .bind(Number(item.qty) || 0, item.id)
      );
    if (stmts.length) await env.DB.batch(stmts);
  } catch (e) {
    // Best-effort restore; do not fail the status update if this errors.
  }
}

function safeJson(v) {
  try {
    const parsed = typeof v === 'string' ? JSON.parse(v) : v;
    return parsed;
  } catch (e) {
    return null;
  }
}

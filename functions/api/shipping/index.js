// Fold — GET /api/shipping
// Public quote used by the checkout page to display the delivery fee for a
// given phone number and order quantity. The authoritative fee is always
// recomputed when the order is created.
import { json } from '../_lib/auth.js';
import { computeShipping, FREE_DELIVERY_ORDERS } from '../_lib/shipping.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
  if (!env.DB) return json({ error: 'Database binding not configured' }, 500);

  const url = new URL(request.url);
  const phone = (url.searchParams.get('phone') || '').toString().trim().replace(/^\+/, '');
  const qty = Number(url.searchParams.get('qty'));

  if (!phone || !Number.isInteger(qty) || qty <= 0) {
    return json({ error: 'phone and a positive integer qty are required' }, 400);
  }

  try {
    const { results } = await env.DB.prepare(
      `SELECT COUNT(*) AS cnt FROM orders WHERE replace(customer_phone, '+', '') = ?`
    )
      .bind(phone)
      .all();
    const priorOrders = Number(results?.[0]?.cnt) || 0;
    return json({
      priorOrders,
      free: priorOrders < FREE_DELIVERY_ORDERS,
      shipping: computeShipping({ priorOrders, totalQty: qty })
    });
  } catch (e) {
    console.error('[shipping] count failed:', e && e.message ? e.message : String(e));
    return json({ error: 'Could not calculate shipping' }, 500);
  }
}

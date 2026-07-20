import { getRows, json, error } from '../../_lib/sheets.js';

export async function onRequest(context) {
  if (context.request.method !== 'GET') return error('Method not allowed', 405);
  try {
    const [products, orders] = await Promise.all([
      getRows(context.env, 'Products'),
      getRows(context.env, 'Orders'),
    ]);
    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const pendingOrders = orders.filter(o => o.status === 'pending' || !o.status);
    return json({
      totalProducts: products.length,
      totalOrders: orders.length,
      totalRevenue,
      pendingOrders: pendingOrders.length,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return error('Server error', 500);
  }
}

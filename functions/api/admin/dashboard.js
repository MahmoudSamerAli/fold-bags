import { getRows } from '../../_lib/sheets.js';
import { requireAdmin, json, error } from '../../_lib/auth.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const admin = await requireAdmin(request, env);
  if (!admin) return error('Unauthorized', 401);
  const [products, orders] = await Promise.all([
    getRows(env, 'Products'),
    getRows(env, 'Orders'),
  ]);
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'pending' || !o.status);
  return json({
    totalProducts: products.length,
    totalOrders: orders.length,
    totalRevenue,
    pendingOrders: pendingOrders.length,
  });
}

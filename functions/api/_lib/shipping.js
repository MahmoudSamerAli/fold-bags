// Fold — shared delivery-fee logic.
//
// Delivery is free for a customer's first orders, then paid based on how many
// units are in the order:
//   - Orders 1..FREE_DELIVERY_ORDERS per phone number: 0 EGP.
//   - Later orders with exactly 1 unit: SHIPPING_FEE_SINGLE (100 EGP).
//   - Later orders with 2+ units: SHIPPING_FEE_MULTI (50 EGP).
//
// This replaces the old "free over 1,000 EGP" threshold.

export const FREE_DELIVERY_ORDERS = 3;
export const SHIPPING_FEE_SINGLE = 100;
export const SHIPPING_FEE_MULTI = 50;

export function computeShipping({ priorOrders, totalQty }) {
  if (priorOrders < FREE_DELIVERY_ORDERS) return 0;
  return totalQty === 1 ? SHIPPING_FEE_SINGLE : SHIPPING_FEE_MULTI;
}

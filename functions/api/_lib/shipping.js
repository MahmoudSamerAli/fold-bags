// Fold — shared delivery-fee logic.
// Delivery is a flat 100 EGP per order, regardless of items or order count.

export const SHIPPING_FEE = 100;

export function computeShipping() {
  return SHIPPING_FEE;
}

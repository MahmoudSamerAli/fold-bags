// Tests for the delivery-fee logic shared by the orders and shipping endpoints.
// Rule: a customer's first FREE_DELIVERY_ORDERS orders are free; later orders
// pay SHIPPING_FEE_SINGLE for a single-unit order or SHIPPING_FEE_MULTI otherwise.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  computeShipping,
  FREE_DELIVERY_ORDERS,
  SHIPPING_FEE_SINGLE,
  SHIPPING_FEE_MULTI
} from '../functions/api/_lib/shipping.js';

test('first FREE_DELIVERY_ORDERS orders per customer are free', () => {
  for (let priorOrders = 0; priorOrders < FREE_DELIVERY_ORDERS; priorOrders++) {
    assert.equal(computeShipping({ priorOrders, totalQty: 1 }), 0);
    assert.equal(computeShipping({ priorOrders, totalQty: 4 }), 0);
  }
});

test('single-unit orders after the free quota pay the single-item fee (100 EGP)', () => {
  assert.equal(
    computeShipping({ priorOrders: FREE_DELIVERY_ORDERS, totalQty: 1 }),
    SHIPPING_FEE_SINGLE
  );
});

test('multi-unit orders after the free quota pay the multi-item fee (50 EGP)', () => {
  assert.equal(
    computeShipping({ priorOrders: FREE_DELIVERY_ORDERS, totalQty: 2 }),
    SHIPPING_FEE_MULTI
  );
  assert.equal(computeShipping({ priorOrders: 12, totalQty: 9 }), SHIPPING_FEE_MULTI);
});

test('the multi-item fee is cheaper than the single-item fee', () => {
  assert.ok(SHIPPING_FEE_MULTI < SHIPPING_FEE_SINGLE);
});

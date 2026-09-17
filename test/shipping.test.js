// Tests for the flat delivery fee (100 EGP per order, always).
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { computeShipping, SHIPPING_FEE } from '../functions/api/_lib/shipping.js';

test('delivery is always 100 EGP regardless of prior orders or quantity', () => {
  assert.equal(computeShipping(), SHIPPING_FEE);
  assert.equal(computeShipping({ priorOrders: 0, totalQty: 1 }), SHIPPING_FEE);
  assert.equal(computeShipping({ priorOrders: 3, totalQty: 1 }), SHIPPING_FEE);
  assert.equal(computeShipping({ priorOrders: 100, totalQty: 1 }), SHIPPING_FEE);
  assert.equal(computeShipping({ priorOrders: 0, totalQty: 5 }), SHIPPING_FEE);
  assert.equal(computeShipping({ priorOrders: 5, totalQty: 10 }), SHIPPING_FEE);
});

test('SHIPPING_FEE constant is 100', () => {
  assert.equal(SHIPPING_FEE, 100);
});

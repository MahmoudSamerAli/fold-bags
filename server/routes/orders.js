const express = require('express');
const router = express.Router();
const { getRows, updateRow } = require('../sheets');
const { requireAdmin } = require('../auth');

router.get('/', requireAdmin, async (req, res) => {
  try {
    const rows = await getRows('Orders');
    return res.json(rows);
  } catch (err) {
    console.error('Error fetching orders:', err);
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const rows = await getRows('Orders');
    const id = req.params.id;
    const row = rows.find(r => String(r.id) === id || r.order_id === id);
    if (!row) return res.status(404).json({ error: 'Order not found' });
    const data = { ...row, status, updated_at: new Date().toISOString() };
    delete data._row;
    await updateRow('Orders', row._row, data);
    return res.json({ success: true });
  } catch (err) {
    console.error('Error updating order:', err);
    return res.status(500).json({ error: 'Failed to update order' });
  }
});

module.exports = router;

const express = require('express');
const { getRows, appendRow, updateRow } = require('../sheets');
const { verifyToken } = require('../auth');

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try { res.json(await getRows('Orders')); }
  catch (err) { res.status(500).json({ error: 'Failed to fetch orders' }); }
});

router.patch('/:id/status', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending','confirmed','shipped','delivered','cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const rows = await getRows('Orders');
    const row = rows.find(r => String(r.id) === req.params.id || r.order_id === req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    const data = { ...row, status, updated_at: new Date().toISOString() };
    delete data._row;
    await updateRow('Orders', row._row, data);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to update status' }); }
});

module.exports = router;

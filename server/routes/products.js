const express = require('express');
const { getRows, appendRow, updateRow, deleteRow } = require('../sheets');
const { verifyToken } = require('../auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try { res.json(await getRows('Products')); }
  catch (err) { res.status(500).json({ error: 'Failed to fetch products' }); }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const rows = await getRows('Products');
    const maxId = rows.reduce((m, r) => Math.max(m, Number(r.id) || 0), 0);
    const now = new Date().toISOString();
    await appendRow('Products', {
      id: String(maxId + 1),
      name: req.body.name || '',
      category: req.body.category || '',
      price: String(req.body.price || 0),
      description: req.body.description || '',
      image: req.body.image || '',
      images: JSON.stringify(req.body.images || []),
      colors: JSON.stringify(req.body.colors || []),
      sizes: JSON.stringify(req.body.sizes || []),
      created_at: now, updated_at: now,
    });
    res.status(201).json({ success: true, id: String(maxId + 1) });
  } catch (err) { res.status(500).json({ error: 'Failed to add product' }); }
});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const rows = await getRows('Products');
    const row = rows.find(r => String(r.id) === req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    await updateRow('Products', row._row, {
      id: row.id,
      name: req.body.name ?? row.name,
      category: req.body.category ?? row.category,
      price: String(req.body.price ?? row.price),
      description: req.body.description ?? row.description,
      image: req.body.image ?? row.image,
      images: req.body.images ? JSON.stringify(req.body.images) : row.images,
      colors: req.body.colors ? JSON.stringify(req.body.colors) : row.colors,
      sizes: req.body.sizes ? JSON.stringify(req.body.sizes) : row.sizes,
      created_at: row.created_at,
      updated_at: new Date().toISOString(),
    });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to update product' }); }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const rows = await getRows('Products');
    const row = rows.find(r => String(r.id) === req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    await deleteRow('Products', row._row);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to delete product' }); }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { getRows, appendRow, updateRow, deleteRow } = require('../sheets');
const { requireAdmin } = require('../auth');

router.get('/', async (req, res) => {
  try {
    const rows = await getRows('Products');
    return res.json(rows);
  } catch (err) {
    console.error('Error fetching products:', err);
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const rows = await getRows('Products');
    const row = rows.find(r => String(r.id) === req.params.id);
    if (!row) return res.status(404).json({ error: 'Product not found' });
    return res.json(row);
  } catch (err) {
    console.error('Error fetching product:', err);
    return res.status(500).json({ error: 'Failed to fetch product' });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  try {
    const body = req.body;
    const rows = await getRows('Products');
    const maxId = rows.reduce((max, r) => Math.max(max, Number(r.id) || 0), 0);
    const now = new Date().toISOString();
    await appendRow('Products', {
      id: String(maxId + 1),
      name: body.name || '',
      category: body.category || '',
      price: String(body.price || 0),
      description: body.description || '',
      image: body.image || '',
      images: JSON.stringify(body.images || []),
      colors: JSON.stringify(body.colors || []),
      sizes: JSON.stringify(body.sizes || []),
      created_at: now,
      updated_at: now,
    });
    return res.status(201).json({ success: true, id: String(maxId + 1) });
  } catch (err) {
    console.error('Error creating product:', err);
    return res.status(500).json({ error: 'Failed to create product' });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const rows = await getRows('Products');
    const row = rows.find(r => String(r.id) === req.params.id);
    if (!row) return res.status(404).json({ error: 'Product not found' });
    const body = req.body;
    const now = new Date().toISOString();
    await updateRow('Products', row._row, {
      id: row.id,
      name: body.name ?? row.name,
      category: body.category ?? row.category,
      price: String(body.price ?? row.price),
      description: body.description ?? row.description,
      image: body.image ?? row.image,
      images: body.images ? JSON.stringify(body.images) : row.images,
      colors: body.colors ? JSON.stringify(body.colors) : row.colors,
      sizes: body.sizes ? JSON.stringify(body.sizes) : row.sizes,
      created_at: row.created_at,
      updated_at: now,
    });
    return res.json({ success: true });
  } catch (err) {
    console.error('Error updating product:', err);
    return res.status(500).json({ error: 'Failed to update product' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const rows = await getRows('Products');
    const row = rows.find(r => String(r.id) === req.params.id);
    if (!row) return res.status(404).json({ error: 'Product not found' });
    await deleteRow('Products', row._row);
    return res.json({ success: true });
  } catch (err) {
    console.error('Error deleting product:', err);
    return res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;

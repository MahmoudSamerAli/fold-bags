const express = require('express');
const bcrypt = require('bcryptjs');
const { generateToken, verifyToken } = require('../auth');
const { getRows } = require('../sheets');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const admins = await getRows('Admins');
    const user = admins.find(a => a.username === username);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ token: generateToken({ username }), username });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/dashboard', verifyToken, async (req, res) => {
  try {
    const [products, orders] = await Promise.all([getRows('Products'), getRows('Orders')]);
    res.json({
      totalProducts: products.length,
      totalOrders: orders.length,
      totalRevenue: orders.reduce((s, o) => s + (Number(o.total) || 0), 0),
      pendingOrders: orders.filter(o => o.status === 'pending' || !o.status).length,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

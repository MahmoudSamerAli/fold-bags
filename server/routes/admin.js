const express = require('express');
const router = express.Router();
const { getRows } = require('../sheets');
const { generateToken, requireAdmin, hashPassword } = require('../auth');

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const envUser = process.env.ADMIN_USERNAME;
    const envPass = process.env.ADMIN_PASSWORD;
    const sha256Hash = hashPassword(password);

    if (username === envUser && sha256Hash === hashPassword(envPass)) {
      const token = generateToken(username);
      return res.json({ token, username });
    }

    const admins = await getRows('Admins');
    const admin = admins.find(a => a.username === username);
    if (admin && admin.password_hash) {
      const bcrypt = require('bcryptjs');
      const match = await bcrypt.compare(password, admin.password_hash);
      if (match) {
        const token = generateToken(username);
        return res.json({ token, username });
      }
    }

    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const [products, orders] = await Promise.all([
      getRows('Products'),
      getRows('Orders'),
    ]);
    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const pendingOrders = orders.filter(o => o.status === 'pending' || !o.status);
    return res.json({
      totalProducts: products.length,
      totalOrders: orders.length,
      totalRevenue,
      pendingOrders: pendingOrders.length,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

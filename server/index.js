require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { getRows, appendRow, getHeaders } = require('./sheets');

const adminRoutes = require('./routes/admin');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/admin', express.static(path.join(__dirname, 'admin')));

app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

async function seedAdmin() {
  try {
    const admins = await getRows('Admins');
    const existing = admins.find(a => a.username === process.env.ADMIN_USERNAME);
    if (!existing) {
      const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
      const maxId = admins.reduce((max, r) => Math.max(max, Number(r.id) || 0), 0);
      await appendRow('Admins', {
        id: String(maxId + 1),
        username: process.env.ADMIN_USERNAME,
        password_hash: hash,
        created_at: new Date().toISOString(),
      });
      console.log(`Admin "${process.env.ADMIN_USERNAME}" seeded`);
    }
  } catch (err) {
    console.error('Admin seed:', err.message);
  }
}

app.listen(PORT, async () => {
  console.log(`Fold Admin → http://localhost:${PORT}`);
  await seedAdmin();
});

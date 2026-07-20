const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/admin', express.static(path.join(__dirname, 'admin')));

app.use('/api/admin', require('./routes/admin'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));

app.get('/', (req, res) => res.json({ status: 'Fold Admin API running' }));

const os = require('os');
const interfaces = os.networkInterfaces();
let networkIp = 'localhost';
for (const name of Object.keys(interfaces)) {
  for (const iface of interfaces[name]) {
    if (iface.family === 'IPv4' && !iface.internal) { networkIp = iface.address; break; }
  }
  if (networkIp !== 'localhost') break;
}

app.listen(PORT, () => {
  console.log(`\n  Fold Admin Server running:`);
  console.log(`  ➜ Local:   http://localhost:${PORT}/admin/dashboard.html`);
  console.log(`  ➜ Network: http://${networkIp}:${PORT}/admin/dashboard.html\n`);
});

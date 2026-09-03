-- Fold — Admin: products table + COD payment status on orders
-- Products move from static data/products.js into D1 so the dashboard can manage them.
-- Payment: Cash on Delivery only; payment_status tracks collection, structured for future expansion.

-- Add payment_status to orders (idempotent-friendly; D1 supports ALTER TABLE ADD COLUMN)
ALTER TABLE orders ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'unpaid';

CREATE INDEX IF NOT EXISTS idx_orders_payment ON orders(payment_status);

-- Products table (category/slug values: crossbody, totes, backpacks)
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  brand TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'crossbody',
  price INTEGER NOT NULL DEFAULT 0,
  old_price INTEGER,
  image TEXT NOT NULL DEFAULT '',
  colors TEXT NOT NULL DEFAULT '[]',
  sizes TEXT NOT NULL DEFAULT '["OS"]',
  stock INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

CREATE TRIGGER IF NOT EXISTS update_products_updated_at
AFTER UPDATE ON products
BEGIN
  UPDATE products SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Admin sessions (short-lived bearer token, derived from ADMIN_PASSWORD)
CREATE TABLE IF NOT EXISTS admin_sessions (
  token TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);

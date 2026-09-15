-- Fold — Admin: drop the app-level admin session table.
-- Admin access is now controlled entirely by Cloudflare Access (Zero Trust),
-- so the short-lived bearer-token sessions (derived from ADMIN_PASSWORD) are gone.
-- The products table is unaffected.

DROP TABLE IF EXISTS admin_sessions;
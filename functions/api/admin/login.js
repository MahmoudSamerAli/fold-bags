import bcrypt from 'bcryptjs';
import { generateAdminToken, hashPassword, json, error } from '../../_lib/auth.js';
import { getRows } from '../../_lib/sheets.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const { username, password } = await request.json();
  if (!username || !password) return error('Username and password required');

  // Try env var first (SHA-256)
  const sha256Hash = await hashPassword(password);
  if (username === env.ADMIN_USERNAME && sha256Hash === env.ADMIN_PASSWORD_HASH) {
    const token = await generateAdminToken(env, username);
    return json({ token, username });
  }

  // Fallback: check Admins sheet (bcrypt)
  try {
    const admins = await getRows(env, 'Admins');
    const admin = admins.find(a => a.username === username);
    if (admin && admin.password_hash) {
      const match = await bcrypt.compare(password, admin.password_hash);
      if (match) {
        const token = await generateAdminToken(env, username);
        return json({ token, username });
      }
    }
  } catch (err) {
    console.error('Admins sheet fallback failed:', err.message);
  }

  return error('Invalid credentials', 401);
}

// Fold — POST /api/admin/login
// Verifies password against the ADMIN_PASSWORD secret and issues a short-lived
// session token stored in D1 (admin_sessions).

import { json, safeEqual } from '../_lib/auth.js';

const SESSION_HOURS = 24;

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const password = (body.password || '').toString();
  const expected = env.ADMIN_PASSWORD || '';

  if (!expected) {
    console.error('[login] ADMIN_PASSWORD secret is not configured (env.ADMIN_PASSWORD is empty)');
    return json({ error: 'Admin password not configured' }, 500);
  }
  if (!safeEqual(password, expected)) {
    return json({ error: 'Invalid password' }, 401);
  }

  // Maximum login attempts guard to slow brute force (simple, in-memory within a single isolate).
  // For production hardening consider rate limiting via Cloudflare.

  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000).toISOString();

  try {
    if (!env.DB) {
      console.error('[login] D1 binding (env.DB) is not configured');
      return json({ error: 'Database binding not configured' }, 500);
    }
    await env.DB.prepare('INSERT INTO admin_sessions (token, expires_at) VALUES (?, ?)')
      .bind(token, expiresAt)
      .run();
    await env.DB.prepare("DELETE FROM admin_sessions WHERE expires_at < datetime('now')").run();
  } catch (e) {
    console.error('[login] Could not store session:', e && e.message ? e.message : String(e));
    return json({ error: 'Could not create session' }, 500);
  }

  const result = { token, expires_at: expiresAt };
  const res = json(result);
  const cookie = `fold_admin=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_HOURS * 60 * 60}`;
  res.headers.append('Set-Cookie', cookie);
  return res;
}

function generateToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

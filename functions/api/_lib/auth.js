// Fold — shared admin auth for Cloudflare Pages Functions.
// Verifies a bearer token stored in the admin_sessions table (D1).
// Tokens are issued on successful login and short-lived.

const SESSION_HOURS = 24;

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function getBearer(request) {
  const header = request.headers.get('Authorization') || '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : null;
}

// Compact constant-time-ish string compare using HMAC strings (Web Crypto aware).
// Kept synchronous for the Workers runtime.
export function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifySession(env, token) {
  if (!token) return false;
  try {
    const row = await env.DB.prepare(
      'SELECT token, expires_at FROM admin_sessions WHERE token = ?'
    ).bind(token).first();
    if (!row) return false;
    if (new Date(row.expires_at) < new Date()) return false;
    return true;
  } catch (e) {
    return false;
  }
}

export async function requireAuth(context) {
  const token = await getBearer(context.request);
  const ok = await verifySession(context.env, token);
  if (!ok) {
    return json({ error: 'Unauthorized' }, 401);
  }
  return null; // proceed
}

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

// Reads a named cookie value from a request's Cookie header.
export function getCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  const match = header.match(new RegExp('(?:^|;\\s*)' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'));
  if (!match) return null;
  try { return decodeURIComponent(match[1]); } catch (e) { return match[1]; }
}

// Constant-time string compare — avoids timing oracles on length or content.
export function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return true;
  const ap = a.padEnd(maxLen, '\0');
  const bp = b.padEnd(maxLen, '\0');
  let diff = a.length ^ b.length;
  for (let i = 0; i < maxLen; i++) diff |= ap.charCodeAt(i) ^ bp.charCodeAt(i);
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

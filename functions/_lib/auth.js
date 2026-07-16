import { SignJWT, jwtVerify } from 'jose';

export async function generateAdminToken(env, username) {
  const secret = new TextEncoder().encode(env.JWT_SECRET);
  return await new SignJWT({ username })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(secret);
}

export async function verifyAdminToken(env, token) {
  try {
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(request) {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function error(msg, status = 400) {
  return json({ error: msg }, status);
}

export async function requireAdmin(request, env) {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return await verifyAdminToken(env, token);
}

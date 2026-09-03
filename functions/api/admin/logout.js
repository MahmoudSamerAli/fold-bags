// Fold — POST /api/admin/logout
// Invalidates the current admin session (deletes the D1 row) and clears the
// HttpOnly session cookie.
import { json, getCookie, getBearer } from '../_lib/auth.js';

const COOKIE = 'fold_admin';

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const token =
    (await getCookie(request, COOKIE)) ||
    (await getBearer(request));

  if (token) {
    try {
      await env.DB.prepare('DELETE FROM admin_sessions WHERE token = ?').bind(token).run();
    } catch (e) {
      // ignore; we still clear the client cookie
    }
  }

  const res = json({ success: true });
  res.headers.append(
    'Set-Cookie',
    `fold_admin=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`
  );
  return res;
}

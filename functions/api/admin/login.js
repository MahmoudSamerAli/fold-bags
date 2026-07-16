import { generateAdminToken, hashPassword, json, error } from '../../_lib/auth.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const { username, password } = await request.json();
  if (!username || !password) return error('Username and password required');
  if (username !== env.ADMIN_USERNAME) return error('Invalid credentials', 401);
  const hash = await hashPassword(password);
  if (hash !== env.ADMIN_PASSWORD_HASH) return error('Invalid credentials', 401);
  const token = await generateAdminToken(env, username);
  return json({ token, username });
}

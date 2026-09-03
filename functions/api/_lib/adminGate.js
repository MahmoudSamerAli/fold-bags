// Fold — shared admin gate.
// Used by the /admin and /admin.html routes. Serves the login/password form
// when there is no valid admin session, and serves the real admin dashboard
// (admin.html) once a valid session exists. Unauthorized visitors never see
// any admin data.
import { verifySession, getCookie, getBearer } from './auth.js';

const COOKIE = 'fold_admin';
const DASHBOARD_PATH = '/admin.html';

export async function adminGate(context) {
  const { request, env } = context;

  const token =
    (await getCookie(request, COOKIE)) ||
    (await getBearer(request));

  if (token && (await verifySession(env, token))) {
    return serveDashboard(context);
  }

  return loginPage();
}

async function serveDashboard(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  url.pathname = DASHBOARD_PATH;
  const proxied = new Request(url.toString(), request);
  return env.ASSETS.fetch(proxied);
}

function loginPage() {
  const html = `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>Fold — Admin</title>
  <style>
    :root{--bg:#f7f4ee;--bg-alt:#efeae1;--border:#e3dccd;--text:#2b2b2b;--text-light:#8a8378;--accent:#a08050;--accent-hover:#8b6c41;}
    *{box-sizing:border-box}
    body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;background:var(--bg);color:var(--text);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1rem}
    .login-card{background:#fff;border:1px solid var(--border);border-radius:14px;padding:2.2rem;width:100%;max-width:360px;box-shadow:0 8px 30px rgba(0,0,0,.06)}
    .login-card h1{margin:0 0 .25rem;font-size:1.5rem}
    .login-card p.sub{margin:0 0 1.6rem;color:var(--text-light);font-size:.9rem}
    .login-card label{display:block;margin-bottom:.35rem;font-weight:600;font-size:.9rem}
    .login-card input[type="password"]{width:100%;padding:.7rem .8rem;border:1px solid var(--border);border-radius:8px;font-size:1rem;margin-bottom:.4rem}
    .login-card input:focus{outline:2px solid var(--accent)}
    .login-error{color:#c0392b;font-size:.85rem;min-height:1rem;margin:.2rem 0 .4rem}
    button{width:100%;padding:.75rem;border:0;border-radius:8px;background:var(--accent);color:#fff;font-size:1rem;font-weight:600;cursor:pointer}
    button:hover{background:var(--accent-hover)}
    button:disabled{opacity:.6;cursor:not-allowed}
  </style>
</head>
<body>
  <form class="login-card" id="login-form">
    <h1>Fold <span style="color:var(--accent)">Admin</span></h1>
    <p class="sub">Sign in to manage orders, products, and payments.</p>
    <label for="password">Password</label>
    <input type="password" id="password" autocomplete="current-password" placeholder="Enter admin password" required>
    <p class="login-error" id="login-error"></p>
    <button type="submit" id="login-btn">Sign In</button>
  </form>
  <script>
    var form = document.getElementById('login-form');
    var err = document.getElementById('login-error');
    var btn = document.getElementById('login-btn');
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      err.textContent = '';
      btn.disabled = true; btn.textContent = 'Signing in…';
      try {
        var res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: document.getElementById('password').value })
        });
        var data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Invalid password');
        localStorage.setItem('fold_admin_token', data.token);
        window.location.href = '/admin';
      } catch (ex) {
        err.textContent = ex.message || 'Invalid password';
      } finally {
        btn.disabled = false; btn.textContent = 'Sign In';
      }
    });
  </script>
</body>
</html>`;
  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

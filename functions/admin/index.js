// Fold — /admin
// Serves the admin dashboard (admin.html) for anyone who reaches this route.
// Reaching this route means Cloudflare Access (Zero Trust) already granted the
// request — the Function does not do its own access control.
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  url.pathname = '/admin.html';
  const proxied = new Request(url.toString(), request);
  return env.ASSETS.fetch(proxied);
}

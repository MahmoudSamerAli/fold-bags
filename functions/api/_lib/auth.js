// Fold — shared response helpers for Cloudflare Pages Functions.
// Admin access is enforced by Cloudflare Access (Zero Trust) at the edge,
// so this module only provides the common JSON response helper now.

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

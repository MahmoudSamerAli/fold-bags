// Tests for the shared auth helpers (functions/api/_lib/auth.js).
// These helpers are pure aside from the injected D1 binding, so they can be
// exercised with plain Node and a mocked env.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  safeEqual,
  json,
  getBearer,
  getCookie,
  verifySession,
  requireAuth
} from '../functions/api/_lib/auth.js';

// ---------- safeEqual ----------

test('safeEqual matches identical strings', () => {
  assert.equal(safeEqual('secret', 'secret'), true);
});

test('safeEqual rejects different strings', () => {
  assert.equal(safeEqual('secret', 'secreT'), false);
});

test('safeEqual treats two empty strings as equal', () => {
  assert.equal(safeEqual('', ''), true);
});

test('safeEqual rejects empty vs non-empty', () => {
  assert.equal(safeEqual('', 'x'), false);
  assert.equal(safeEqual('x', ''), false);
});

test('safeEqual rejects same-prefix different lengths', () => {
  assert.equal(safeEqual('abc', 'abcX'), false);
  assert.equal(safeEqual('abcX', 'abc'), false);
});

test('safeEqual rejects non-string inputs', () => {
  assert.equal(safeEqual(null, 'x'), false);
  assert.equal(safeEqual(undefined, undefined), false);
  assert.equal(safeEqual(42, '42'), false);
  assert.equal(safeEqual({}, {}), false);
});

test('safeEqual catches a single-char difference at the end', () => {
  assert.equal(safeEqual('correct horse battery staple', 'correct horse battery stapple'), false);
});

// ---------- json ----------

test('json returns a JSON response with default 200 status', async () => {
  const res = json({ ok: true });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('Content-Type'), 'application/json');
  assert.deepEqual(await res.json(), { ok: true });
});

test('json honors a custom status', () => {
  assert.equal(json({}, 404).status, 404);
  assert.equal(json({}, 500).status, 500);
});

// ---------- getBearer ----------

test('getBearer extracts a Bearer token', async () => {
  const req = new Request('http://x/', { headers: { Authorization: 'Bearer abc123' } });
  assert.equal(await getBearer(req), 'abc123');
});

test('getBearer returns null with no Authorization header', async () => {
  const req = new Request('http://x/');
  assert.equal(await getBearer(req), null);
});

test('getBearer is case-sensitive and rejects non-Bearer schemes', async () => {
  for (const header of ['bearer abc123', 'Basic abc123', 'Bearer']) {
    const req = new Request('http://x/', { headers: { Authorization: header } });
    assert.equal(await getBearer(req), null, `expected null for "${header}"`);
  }
});

// ---------- getCookie ----------

test('getCookie reads a named cookie', () => {
  const req = new Request('http://x/', { headers: { Cookie: 'a=1; fold_admin=tok123; b=2' } });
  assert.equal(getCookie(req, 'fold_admin'), 'tok123');
});

test('getCookie does not match partial names', () => {
  const req = new Request('http://x/', { headers: { Cookie: 'fold_admin_x=1; fold_adm=2' } });
  assert.equal(getCookie(req, 'fold_admin'), null);
});

test('getCookie URL-decodes values', () => {
  const req = new Request('http://x/', { headers: { Cookie: 'fold_admin=hello%20world' } });
  assert.equal(getCookie(req, 'fold_admin'), 'hello world');
});

test('getCookie returns null when the header is absent', () => {
  assert.equal(getCookie(new Request('http://x/'), 'fold_admin'), null);
});

// ---------- verifySession / requireAuth ----------

function dbWithFirst(row) {
  return {
    prepare: () => ({ bind: () => ({ first: async () => row }) })
  };
}

test('verifySession accepts a future-dated session', async () => {
  const env = {
    DB: dbWithFirst({ token: 'tok', expires_at: new Date(Date.now() + 60_000).toISOString() })
  };
  assert.equal(await verifySession(env, 'tok'), true);
});

test('verifySession rejects an expired session', async () => {
  const env = {
    DB: dbWithFirst({ token: 'tok', expires_at: new Date(Date.now() - 60_000).toISOString() })
  };
  assert.equal(await verifySession(env, 'tok'), false);
});

test('verifySession rejects a missing session row', async () => {
  assert.equal(await verifySession({ DB: dbWithFirst(undefined) }, 'tok'), false);
});

test('verifySession rejects a missing token and DB errors', async () => {
  assert.equal(await verifySession({ DB: dbWithFirst(undefined) }, ''), false);
  const throwing = {
    prepare: () => ({
      bind: () => ({
        first: async () => {
          throw new Error('boom');
        }
      })
    })
  };
  assert.equal(await verifySession({ DB: throwing }, 'tok'), false);
});

test('requireAuth returns 401 when unauthenticated', async () => {
  const context = { request: new Request('http://x/api/admin/orders') };
  const res = await requireAuth(context);
  assert.equal(res.status, 401);
  assert.deepEqual(await res.json(), { error: 'Unauthorized' });
});

test('requireAuth returns null when the session is valid', async () => {
  const context = {
    request: new Request('http://x/api/admin/orders', {
      headers: { Authorization: 'Bearer tok' }
    }),
    env: {
      DB: dbWithFirst({ token: 'tok', expires_at: new Date(Date.now() + 60_000).toISOString() })
    }
  };
  assert.equal(await requireAuth(context), null);
});

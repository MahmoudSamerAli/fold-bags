// Fold — Cloudflare Access (Zero Trust) provisioning for the admin area.
//
// wrangler has no `access` command, so this script talks to the Cloudflare
// REST API directly to create a self-hosted Access application that gates the
// admin dashboard and the admin APIs.
//
// Prerequisites:
//   1. Create an API token at https://dash.cloudflare.com/profile/api-tokens
//      with the permission: Account → Access: Apps and Policies → Edit.
//   2. Export it and run this script:
//        CLOUDFLARE_API_TOKEN=... node scripts/setup-access.mjs
//
// Usage:
//   node scripts/setup-access.mjs [options]
//
// Options:
//   --account <id>      Cloudflare account ID (default: $CLOUDFLARE_ACCOUNT_ID or
//                       the Fold account).
//   --hostname <host>   Public hostname to protect (default: fold-bags.pages.dev).
//   --email <email>     Admin email allowed by the policy (repeatable).
//                       Default: mahmoud.samer2005@gmail.com.
//   --session <dur>     Access session duration (default: 24h).
//   --replace           Delete any existing Access app for the hostname before
//                       creating a fresh one (use to repair a broken app).
//   --list              Only list existing Access apps for the account and exit.
//   --dry-run           Print the payload and exit without changing anything.
//
// The script reads a local `.env` file if present (KEY=VALUE lines).

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const API_BASE = 'https://api.cloudflare.com/client/v4';
const DEFAULT_ACCOUNT = '6578a193085d3cc290c7e31a8493fa36';
const DEFAULT_HOSTNAME = 'fold-bags.pages.dev';
const DEFAULT_EMAIL = 'mahmoud.samer2005@gmail.com';
const APP_NAME = 'Fold Admin';
const PATHS = ['/admin', '/admin/*', '/api/admin/*'];

function loadDotEnv() {
  const file = resolve(process.cwd(), '.env');
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (!m) continue;
    const value = m[2].replace(/^["']|["']$/g, '');
    if (!(m[1] in process.env)) process.env[m[1]] = value;
  }
}

function parseArgs(argv) {
  const opts = { emails: [], replace: false, list: false, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--account') opts.account = argv[++i];
    else if (a === '--hostname') opts.hostname = argv[++i];
    else if (a === '--email') opts.emails.push(argv[++i]);
    else if (a === '--session') opts.session = argv[++i];
    else if (a === '--replace') opts.replace = true;
    else if (a === '--list') opts.list = true;
    else if (a === '--dry-run') opts.dryRun = true;
    else if (a === '--help' || a === '-h') opts.help = true;
    else throw new Error(`Unknown argument: ${a}`);
  }
  return opts;
}

function usage() {
  console.log(
    [
      'Usage: CLOUDFLARE_API_TOKEN=... node scripts/setup-access.mjs [options]',
      '',
      '  --account <id>     Cloudflare account ID',
      '  --hostname <host>  Hostname to protect (default: fold-bags.pages.dev)',
      '  --email <email>    Allowed admin email (repeatable)',
      '  --session <dur>    Session duration (default: 24h)',
      '  --replace          Delete an existing app for the hostname, then recreate',
      '  --list             List existing Access apps and exit',
      '  --dry-run          Print the payload without applying it',
      '  --help             Show this help'
    ].join('\n')
  );
}

async function cf(token, method, path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = { success: false, errors: [{ message: `HTTP ${res.status}` }] };
  }
  if (!res.ok || data.success === false) {
    const detail = (data.errors || []).map((e) => e.message).join('; ') || `HTTP ${res.status}`;
    throw new Error(`${method} ${path} failed: ${detail}`);
  }
  return data.result;
}

function appHosts(app) {
  const hosts = new Set();
  if (typeof app.domain === 'string') hosts.add(app.domain);
  for (const d of app.self_hosted_domains || []) hosts.add(d);
  for (const d of app.destinations || []) {
    if (d.uri) hosts.add(d.uri);
    if (d.hostname) hosts.add(d.hostname);
  }
  return [...hosts];
}

function matchesHost(app, hostname) {
  return appHosts(app).some((h) => h === hostname || h.startsWith(hostname + '/'));
}

function buildPayload({ hostname, emails, session }) {
  const uris = PATHS.map((p) => hostname + p);
  return {
    type: 'self_hosted',
    name: APP_NAME,
    domain: uris[0],
    self_hosted_domains: uris,
    destinations: uris.map((uri) => ({ type: 'public', uri })),
    session_duration: session,
    auto_redirect_to_identity: true,
    app_launcher_visible: false,
    skip_interstitial: true,
    policies: [
      {
        name: 'Fold admins',
        decision: 'allow',
        precedence: 1,
        include: emails.map((email) => ({ email: { email } }))
      }
    ]
  };
}

async function main() {
  loadDotEnv();
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) return usage();

  const token = process.env.CLOUDFLARE_API_TOKEN;
  const account = opts.account || process.env.CLOUDFLARE_ACCOUNT_ID || DEFAULT_ACCOUNT;
  const hostname = opts.hostname || DEFAULT_HOSTNAME;
  const emails = opts.emails.length ? opts.emails : [DEFAULT_EMAIL];
  const session = opts.session || '24h';

  if (!token) {
    console.error(
      'Missing CLOUDFLARE_API_TOKEN. Create one with "Access: Apps and Policies: Edit".'
    );
    return process.exit(1);
  }

  console.log(`Account:  ${account}`);
  console.log(`Hostname: ${hostname}`);
  console.log(`Emails:   ${emails.join(', ')}`);

  const listPath = `/accounts/${account}/access/apps?per_page=1000`;
  const apps = await cf(token, 'GET', listPath);
  const existing = (apps || []).filter((a) => matchesHost(a, hostname));

  console.log(`\nFound ${existing.length} existing Access app(s) for ${hostname}:`);
  for (const a of existing) {
    console.log(`  - ${a.name} (${a.id}) [${a.type}] -> ${appHosts(a).join(', ')}`);
  }

  if (opts.list) return;

  const payload = buildPayload({ hostname, emails, session });
  if (opts.dryRun) {
    console.log('\n--dry-run: would POST /access/apps with:');
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  if (existing.length && !opts.replace) {
    console.error(
      '\nAn app already exists for this hostname. Re-run with --replace to delete it and create a fresh one.'
    );
    return process.exit(1);
  }

  for (const a of existing) {
    console.log(`\nDeleting existing app ${a.name} (${a.id})...`);
    await cf(token, 'DELETE', `/accounts/${account}/access/apps/${a.id}`);
  }

  console.log('\nCreating Access application...');
  const app = await cf(token, 'POST', `/accounts/${account}/access/apps`, payload);
  console.log(`✓ Created "${app.name}" (${app.id})`);
  console.log(`  Domain(s): ${appHosts(app).join(', ') || hostname}`);
  console.log('\nAdmin access is now gated by Cloudflare Access.');
  console.log(
    `Log out URL: https://${hostname.replace(/\./g, '-')}.cloudflareaccess.com/cdn-cgi/access/logout`
  );
}

main().catch((err) => {
  console.error(`\nError: ${err.message}`);
  process.exit(1);
});

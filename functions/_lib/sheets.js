import { SignJWT, importPKCS8 } from 'jose';

let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken(env) {
  if (cachedToken && Date.now() < tokenExpiry - 60000) {
    return cachedToken;
  }
  const now = Math.floor(Date.now() / 1000);
  let key = env.GOOGLE_PRIVATE_KEY;
  if (key.includes('\\n')) key = key.replace(/\\n/g, '\n');
  const privateKey = await importPKCS8(key, 'RS256');
  const jwt = await new SignJWT({
    iss: env.GOOGLE_CLIENT_EMAIL,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .sign(privateKey);
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = now * 1000 + (data.expires_in || 3600) * 1000;
  return cachedToken;
}

async function request(env, method, path, body = null) {
  const token = await getAccessToken(env);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${env.SHEET_ID}/${path}`;
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const res = await fetch(url, {
    method, headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Sheets API ${res.status}: ${err}`);
  }
  return res.json();
}

export async function getRows(env, tabName) {
  const data = await request(env, 'GET', `values/${tabName}?valueRenderOption=UNFORMATTED_VALUE`);
  const values = data.values || [];
  if (values.length < 2) return [];
  const headers = values[0];
  return values.slice(1).map((row, idx) => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i] !== undefined ? row[i] : ''; });
    obj._row = idx + 1;
    return obj;
  });
}

export async function appendRow(env, tabName, data) {
  const h = await request(env, 'GET', `values/${tabName}!1:1`);
  const headers = h.values?.[0] || [];
  const values = headers.map(h => String(data[h] !== undefined ? data[h] : ''));
  await request(env, 'POST', `values/${tabName}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
    values: [values],
  });
}

export async function updateRow(env, tabName, rowIndex, data) {
  const h = await request(env, 'GET', `values/${tabName}!1:1`);
  const headers = h.values?.[0] || [];
  const values = headers.map(h => String(data[h] !== undefined ? data[h] : ''));
  await request(env, 'PUT', `values/${tabName}!A${rowIndex + 1}?valueInputOption=USER_ENTERED`, {
    values: [values],
  });
}

export async function deleteRow(env, tabName, rowIndex) {
  const meta = await request(env, 'GET', '');
  const sheet = meta.sheets.find(s => s.properties.title === tabName);
  if (!sheet) throw new Error(`Tab "${tabName}" not found`);
  const gid = sheet.properties.sheetId;
  await request(env, 'POST', ':batchUpdate', {
    requests: [{
      deleteDimension: {
        range: { sheetId: gid, dimension: 'ROWS', startIndex: rowIndex, endIndex: rowIndex + 1 },
      },
    }],
  });
}

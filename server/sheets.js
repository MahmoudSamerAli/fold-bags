const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

let sheetsClient = null;
let sheetGids = {};

async function getClient() {
  if (sheetsClient) return sheetsClient;
  const keyPath = path.resolve(__dirname, process.env.GOOGLE_SERVICE_ACCOUNT_PATH);
  const key = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  const auth = new google.auth.GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

async function getGid(tab) {
  if (sheetGids[tab]) return sheetGids[tab];
  const sheets = await getClient();
  const res = await sheets.spreadsheets.get({ spreadsheetId: process.env.SHEET_ID });
  const s = res.data.sheets.find(x => x.properties.title === tab);
  if (!s) throw new Error(`Tab "${tab}" not found`);
  sheetGids[tab] = s.properties.sheetId;
  return sheetGids[tab];
}

async function getHeaders(tab) {
  const sheets = await getClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID, range: `${tab}!1:1`,
    valueRenderOption: 'UNFORMATTED_VALUE',
  });
  return res.data.values?.[0] || [];
}

async function getRows(tab) {
  const sheets = await getClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID, range: tab,
    valueRenderOption: 'UNFORMATTED_VALUE',
  });
  const vals = res.data.values || [];
  if (vals.length < 2) return [];
  const h = vals[0];
  return vals.slice(1).map((r, i) => {
    const o = {};
    h.forEach((c, j) => { o[c] = r[j] !== undefined ? r[j] : ''; });
    o._row = i + 1;
    return o;
  });
}

async function appendRow(tab, data) {
  const sheets = await getClient();
  const h = await getHeaders(tab);
  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.SHEET_ID, range: tab,
    valueInputOption: 'USER_ENTERED', insertDataOption: 'INSERT_ROWS',
    resource: { values: [h.map(c => String(data[c] !== undefined ? data[c] : ''))] },
  });
}

async function updateRow(tab, rowIdx, data) {
  const sheets = await getClient();
  const h = await getHeaders(tab);
  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.SHEET_ID, range: `${tab}!A${rowIdx + 1}`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [h.map(c => String(data[c] !== undefined ? data[c] : ''))] },
  });
}

async function deleteRow(tab, rowIdx) {
  const sheets = await getClient();
  const gid = await getGid(tab);
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: process.env.SHEET_ID,
    resource: {
      requests: [{
        deleteDimension: {
          range: { sheetId: gid, dimension: 'ROWS', startIndex: rowIdx, endIndex: rowIdx + 1 },
        },
      }],
    },
  });
}

module.exports = { getRows, appendRow, updateRow, deleteRow, getHeaders };

const { google } = require('googleapis');
const path = require('path');

let sheetsClient = null;

async function getSheetsClient() {
  if (sheetsClient) return sheetsClient;
  const keyPath = path.resolve(__dirname, process.env.GOOGLE_SERVICE_ACCOUNT_PATH);
  const auth = new google.auth.GoogleAuth({
    keyFile: keyPath,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

function getSheetId() {
  return process.env.SHEET_ID;
}

async function getRows(tabName) {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSheetId(),
    range: tabName,
    valueRenderOption: 'UNFORMATTED_VALUE',
  });
  const values = res.data.values || [];
  if (values.length < 2) return [];
  const headers = values[0];
  return values.slice(1).map((row, idx) => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i] !== undefined ? row[i] : ''; });
    obj._row = idx + 2;
    return obj;
  });
}

async function appendRow(tabName, data) {
  const sheets = await getSheetsClient();
  const h = await sheets.spreadsheets.values.get({
    spreadsheetId: getSheetId(),
    range: `${tabName}!1:1`,
  });
  const headers = h.data.values?.[0] || [];
  const values = headers.map(h => String(data[h] !== undefined ? data[h] : ''));
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSheetId(),
    range: tabName,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [values] },
  });
}

async function updateRow(tabName, rowNum, data) {
  const sheets = await getSheetsClient();
  const h = await sheets.spreadsheets.values.get({
    spreadsheetId: getSheetId(),
    range: `${tabName}!1:1`,
  });
  const headers = h.data.values?.[0] || [];
  const values = headers.map(h => String(data[h] !== undefined ? data[h] : ''));
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSheetId(),
    range: `${tabName}!A${rowNum}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [values] },
  });
}

async function deleteRow(tabName, rowNum) {
  const sheets = await getSheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: getSheetId() });
  const sheet = meta.data.sheets.find(s => s.properties.title === tabName);
  if (!sheet) throw new Error(`Tab "${tabName}" not found`);
  const gid = sheet.properties.sheetId;
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: getSheetId(),
    requestBody: {
      requests: [{
        deleteDimension: {
          range: { sheetId: gid, dimension: 'ROWS', startIndex: rowNum - 1, endIndex: rowNum },
        },
      }],
    },
  });
}

module.exports = { getRows, appendRow, updateRow, deleteRow };

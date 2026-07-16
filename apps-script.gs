function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet();
    const orders = sheet.getSheetByName('Orders');
    if (!orders) return error('Orders tab not found');
    const lastRow = orders.getLastRow();
    const newId = lastRow > 1 ? Number(orders.getRange(lastRow, 1).getValue()) + 1 : 1;
    const now = new Date().toISOString();
    orders.appendRow([
      newId, data.order_id || '', data.customer_name || '', data.customer_phone || '',
      data.city || '', data.address || '', data.payment_method || '',
      typeof data.items === 'string' ? data.items : JSON.stringify(data.items || []),
      String(data.subtotal || 0), String(data.shipping || 0), String(data.total || 0),
      'pending', now, now,
    ]);
    return output({ success: true, id: newId });
  } catch (err) { return error(err.message); }
}

function output(d) {
  return ContentService.createTextOutput(JSON.stringify(d)).setMimeType(ContentService.MimeType.JSON);
}
function error(m) { return output({ success: false, error: m }); }

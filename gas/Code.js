function doGet(e) {
  const op = e.parameter.op;

  if (op === 'history') {
    return ContentService.createTextOutput(JSON.stringify(getHistory()))
      .setMimeType(ContentService.MimeType.JSON);
  } else if (op === 'price') {
    const symbol = e.parameter.symbol;
    return ContentService.createTextOutput(JSON.stringify(fetchPrice(symbol)))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Default: get transactions
  return ContentService.createTextOutput(JSON.stringify(getTransactions()))
    .setMimeType(ContentService.MimeType.JSON);
}

// Run this function in the editor to test and grant permissions!
function test() {
  console.log(fetchPrice('2330.TW'));
}

function fetchPrice(symbol) {
  if (!symbol) return { error: 'Symbol missing' };

  // User suggested simple URL. 
  const url = "https://query1.finance.yahoo.com/v8/finance/chart/" + symbol;

  try {
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });

    if (response.getResponseCode() !== 200) {
      return { error: "Yahoo API Error: " + response.getResponseCode() };
    }

    const content = response.getContentText();
    const json = JSON.parse(content);

    // Extract data directly here (Backend Logic)
    const result = json.chart && json.chart.result && json.chart.result[0];
    const meta = result && result.meta;

    if (meta) {
      return {
        current: meta.regularMarketPrice,
        previousClose: meta.previousClose || meta.chartPreviousClose
      };
    }

    return { error: "No market data found in response" };
  } catch (e) {
    return { error: e.toString() };
  }
}

function doPost(e) {
  // Handle CORS preflight if needed, though usually GAS handles POST differently
  // For simple requests, we just parse the body

  try {
    if (e.postData && e.postData.contents) {
      const data = JSON.parse(e.postData.contents);
      const op = data.op;

      let result;
      if (op === 'add') {
        result = addTransaction(data.transaction);
      } else if (op === 'delete') {
        result = deleteTransaction(data.id);
      } else {
        result = { error: 'Unknown operation' };
      }

      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // If no postData (simple GET without op), return transactions
    return ContentService.createTextOutput(JSON.stringify(getTransactions()))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Setup Transactions Sheet
  let txnSheet = ss.getSheetByName('Transactions');
  if (!txnSheet) {
    txnSheet = ss.insertSheet('Transactions');
    txnSheet.appendRow(['id', 'date', 'type', 'symbol', 'shares', 'price', 'fee', 'tax', 'total', 'note', 'broker', 'currency']);
  }

  // Setup History Sheet
  let histSheet = ss.getSheetByName('History');
  if (!histSheet) {
    histSheet = ss.insertSheet('History');
    histSheet.appendRow([
      'date',
      'twMarketValue', 'twCost', 'twPLRate',
      'usMarketValueUSD', 'usCostUSD', 'usPLRate',
      'totalPLRate'
    ]);
  }
}

function getTransactions() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Transactions');
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return []; // Only headers

  const headers = data[0];
  const rows = data.slice(1);

  return rows.map(row => {
    const txn = {};
    headers.forEach((header, index) => {
      txn[header] = row[index];
    });
    return txn;
  });
}

function addTransaction(txn) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Transactions');
  if (!sheet) {
    setup();
    sheet = ss.getSheetByName('Transactions');
  }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(header => txn[header] || '');

  sheet.appendRow(row);
  return txn;
}

function deleteTransaction(id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Transactions');
  if (!sheet) return { success: false };

  const data = sheet.getDataRange().getValues();
  const idIndex = data[0].indexOf('id');

  if (idIndex === -1) return { success: false, error: 'ID column not found' };

  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex] == id) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }

  return { success: false, error: 'Transaction not found' };
}

function getHistory() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('History');
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  const headers = data[0];
  const rows = data.slice(1);

  return rows.map(row => {
    const item = {};
    headers.forEach((header, index) => {
      item[header] = row[index];
    });
    return item;
  });
}

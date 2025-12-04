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

function doPost(e) {
  try {
    if (e.postData && e.postData.contents) {
      const data = JSON.parse(e.postData.contents);
      const op = data.op;

      let result;
      if (op === 'add') {
        result = addTransaction(data.transaction);
      } else if (op === 'delete') {
        result = deleteTransaction(data.id);
      } else if (op === 'importHistory') {
        result = importHistoryData(data.historyItems, data.overwrite);
      } else if (op === 'clearHistory') {
        result = clearHistory();
      } else if (op === 'importTransactions') {
        result = importTransactions(data.transactions);
      } else {
        result = { error: 'Unknown operation' };
      }

      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify(getTransactions()))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// --- CORE FUNCTIONS ---

function fetchPrice(symbol) {
  if (!symbol) return { error: 'Symbol missing' };

  // Handle TWD=X specifically for exchange rate
  if (symbol === 'TWD=X' || symbol === 'USD/TWD') {
    const url = "https://query1.finance.yahoo.com/v8/finance/chart/TWD=X";
    try {
      const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
      const json = JSON.parse(response.getContentText());
      const result = json.chart && json.chart.result && json.chart.result[0];
      const meta = result && result.meta;
      if (meta) {
        return { current: meta.regularMarketPrice, previousClose: meta.previousClose };
      }
    } catch (e) {
      return { error: e.toString() };
    }
  }

  const url = "https://query1.finance.yahoo.com/v8/finance/chart/" + symbol;

  try {
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });

    if (response.getResponseCode() !== 200) {
      return { error: "Yahoo API Error: " + response.getResponseCode() };
    }

    const content = response.getContentText();
    const json = JSON.parse(content);

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

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Setup Transactions Sheet
  let txnSheet = ss.getSheetByName('Transactions');
  if (!txnSheet) {
    txnSheet = ss.insertSheet('Transactions');
    txnSheet.appendRow(['id', 'date', 'type', 'symbol', 'shares', 'price', 'fee', 'tax', 'total', 'notes', 'broker', 'currency']);
  }

  // Setup History Sheet with EXTENDED columns
  let histSheet = ss.getSheetByName('History');
  if (!histSheet) {
    histSheet = ss.insertSheet('History');
    // Columns based on user request:
    // Date, TW_MV, TW_Cost, TW_PL, TW_PL%, US_TWD_MV, US_TWD_Cost, US_TWD_PL, US_TWD_PL%, US_USD_MV, US_USD_Cost, US_USD_PL, US_USD_PL%, Total_MV, Total_Cost, Total_PL, Total_PL%
    histSheet.appendRow([
      'Date',
      'TW Market Value', 'TW Cost', 'TW P/L', 'TW P/L %',
      'US(TWD) MV', 'US(TWD) Cost', 'US(TWD) P/L', 'US(TWD) P/L %',
      'US(USD) MV', 'US(USD) Cost', 'US(USD) P/L', 'US(USD) P/L %',
      'Total MV', 'Total Cost', 'Total P/L', 'Total P/L %'
    ]);
  }
}

// --- DATA ACCESS ---

function getTransactions() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Transactions');
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

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
  if (!sheet) { setup(); sheet = ss.getSheetByName('Transactions'); }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(header => {
    if (header === 'note' || header === 'notes') return txn.notes || txn.note || '';
    return txn[header] || '';
  });

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

  // Map the extended columns to the JSON keys expected by the Frontend
  // Frontend expects: date, twMarketValue, twCost, twPLRate, usMarketValueUSD, usCostUSD, usPLRate, totalPLRate

  // Column Indices (0-based):
  // 0: Date, 1: TW MV, 2: TW Cost, 3: TW PL, 4: TW PL%
  // 5: US(TWD) MV, 6: US(TWD) Cost, 7: US(TWD) PL, 8: US(TWD) PL%
  // 9: US(USD) MV, 10: US(USD) Cost, 11: US(USD) PL, 12: US(USD) PL%
  // 13: Total MV, 14: Total Cost, 15: Total PL, 16: Total PL%

  const rows = data.slice(1);

  return rows.map(row => {
    // Helper to parse percentage string "1.40%" -> 1.40
    const parsePercent = (val) => {
      if (typeof val === 'string' && val.includes('%')) {
        return parseFloat(val.replace('%', ''));
      }
      return val;
    };

    return {
      date: row[0],
      twMarketValue: row[1],
      twCost: row[2],
      twPL: row[3],
      twPLRate: parsePercent(row[4]),

      usTwdMarketValue: row[5],
      usTwdCost: row[6],
      usTwdPL: row[7],
      usTwdPLRate: parsePercent(row[8]),

      usMarketValueUSD: row[9],
      usCostUSD: row[10],
      usPLUSD: row[11],
      usPLRate: parsePercent(row[12]),

      totalMarketValue: row[13],
      totalCost: row[14],
      totalPL: row[15],
      totalPLRate: parsePercent(row[16])
    };
  });
}

function importHistoryData(items, overwrite) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let histSheet = ss.getSheetByName('History');
  if (!histSheet) { setup(); histSheet = ss.getSheetByName('History'); }

  if (!items || !Array.isArray(items)) return { error: 'Invalid data' };

  if (overwrite) {
    const lastRow = histSheet.getLastRow();
    if (lastRow > 1) {
      histSheet.getRange(2, 1, lastRow - 1, histSheet.getLastColumn()).clearContent();
    }
  }

  // items is array of objects matching the history structure
  // We need to convert back to rows
  // Columns: Date, TW_MV, TW_Cost, TW_PL, TW_PL%, US_TWD_MV, US_TWD_Cost, US_TWD_PL, US_TWD_PL%, US_USD_MV, US_USD_Cost, US_USD_PL, US_USD_PL%, Total_MV, Total_Cost, Total_PL, Total_PL%

  const rows = items.map(item => [
    item.date,
    item.twMarketValue, item.twCost, item.twPL, item.twPLRate + '%',
    item.usTwdMarketValue, item.usTwdCost, item.usTwdPL, item.usTwdPLRate + '%',
    item.usUsdMarketValue, item.usUsdCost, item.usUsdPL, item.usUsdPLRate + '%',
    item.totalMarketValue, item.totalCost, item.totalPL, item.totalPLRate + '%'
  ]);

  if (rows.length > 0) {
    // Batch append
    const lastRow = histSheet.getLastRow();
    histSheet.getRange(lastRow + 1, 1, rows.length, rows[0].length).setValues(rows);
  }

  return { success: true, count: rows.length };
}

function importTransactions(txns) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Transactions');
  if (!sheet) { setup(); sheet = ss.getSheetByName('Transactions'); }

  if (!txns || !Array.isArray(txns)) return { error: 'Invalid data' };

  // Columns: id, date, type, symbol, shares, price, fee, tax, total, note, broker, currency
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  const rows = txns.map(txn => {
    return headers.map(header => {
      if (header === 'note' || header === 'notes') return txn.notes || txn.note || '';
      return txn[header] || '';
    });
  });

  if (rows.length > 0) {
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow + 1, 1, rows.length, rows[0].length).setValues(rows);
  }

  return { success: true, count: rows.length };
}

function clearHistory() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('History');
  if (!sheet) return { success: false };

  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }
  return { success: true };
}

// --- NEW FEATURES: IMPORT & DAILY UPDATE ---

// 1. Run this function ONCE to set up the 8 AM trigger
function createDailyTrigger() {
  // Delete existing triggers to avoid duplicates
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'recordDailySnapshot') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  ScriptApp.newTrigger('recordDailySnapshot')
    .timeBased()
    .everyDays(1)
    .atHour(8) // 8 AM
    .inTimezone("Asia/Taipei")
    .create();

  console.log("Daily trigger set for 8 AM Taipei time.");
}

// 2. The function that runs daily
function recordDailySnapshot() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let histSheet = ss.getSheetByName('History');
  if (!histSheet) { setup(); histSheet = ss.getSheetByName('History'); }

  // Calculate current stats
  const stats = calculatePortfolioStats();

  // Format Date: YYYY/MM/DD
  const today = new Date();
  const dateStr = Utilities.formatDate(today, "Asia/Taipei", "yyyy/MM/dd");

  // Prepare Row
  // Columns: Date, TW_MV, TW_Cost, TW_PL, TW_PL%, US_TWD_MV, US_TWD_Cost, US_TWD_PL, US_TWD_PL%, US_USD_MV, US_USD_Cost, US_USD_PL, US_USD_PL%, Total_MV, Total_Cost, Total_PL, Total_PL%

  const row = [
    dateStr,
    stats.tw.mv, stats.tw.cost, stats.tw.pl, stats.tw.plRate + '%',
    stats.usTwd.mv, stats.usTwd.cost, stats.usTwd.pl, stats.usTwd.plRate + '%',
    stats.usUsd.mv, stats.usUsd.cost, stats.usUsd.pl, stats.usUsd.plRate + '%',
    stats.total.mv, stats.total.cost, stats.total.pl, stats.total.plRate + '%'
  ];

  histSheet.appendRow(row);
  console.log("Recorded snapshot for " + dateStr);
}

// 3. Helper to calculate stats
function calculatePortfolioStats() {
  const txns = getTransactions();

  // 1. Calculate Holdings
  const holdings = {}; // symbol -> { shares, cost, broker }
  txns.forEach(t => {
    if (!holdings[t.symbol]) holdings[t.symbol] = { shares: 0, cost: 0, broker: t.broker };
    if (t.type === 'buy') {
      holdings[t.symbol].shares += Number(t.shares);
      holdings[t.symbol].cost += Number(t.total); // Total cost in original currency
    } else if (t.type === 'sell') {
      // FIFO or Avg Cost logic? Simplified Avg Cost for snapshot
      const avgCost = holdings[t.symbol].cost / holdings[t.symbol].shares;
      holdings[t.symbol].shares -= Number(t.shares);
      holdings[t.symbol].cost -= (Number(t.shares) * avgCost);
    }
  });

  // 2. Fetch Prices & Rate
  const rateData = fetchPrice('TWD=X');
  const exchangeRate = (rateData && rateData.current) ? rateData.current : 32.5; // Fallback

  let tw = { mv: 0, cost: 0, pl: 0, plRate: 0 };
  let usUsd = { mv: 0, cost: 0, pl: 0, plRate: 0 };

  Object.keys(holdings).forEach(symbol => {
    const h = holdings[symbol];
    if (h.shares <= 0) return;

    // Fetch price
    // Add .TW logic if needed, similar to frontend
    let fetchSym = symbol;
    if (/^\d{4,6}$/.test(symbol)) fetchSym = symbol + '.TW';

    const priceData = fetchPrice(fetchSym);
    const currentPrice = (priceData && priceData.current) ? priceData.current : 0;

    if (h.broker === 'FubonTW' || h.broker === 'SinoPac') {
      // TW Stock
      const mv = h.shares * currentPrice;
      tw.mv += mv;
      tw.cost += h.cost;
    } else {
      // US Stock (USD)
      const mv = h.shares * currentPrice;
      usUsd.mv += mv;
      usUsd.cost += h.cost;
    }
  });

  // 3. Compute Aggregates
  tw.pl = tw.mv - tw.cost;
  tw.plRate = tw.cost > 0 ? ((tw.pl / tw.cost) * 100).toFixed(2) : 0;

  usUsd.pl = usUsd.mv - usUsd.cost;
  usUsd.plRate = usUsd.cost > 0 ? ((usUsd.pl / usUsd.cost) * 100).toFixed(2) : 0;

  const usTwd = {
    mv: usUsd.mv * exchangeRate,
    cost: usUsd.cost * exchangeRate,
    pl: (usUsd.mv - usUsd.cost) * exchangeRate,
    plRate: usUsd.plRate
  };

  const total = {
    mv: tw.mv + usTwd.mv,
    cost: tw.cost + usTwd.cost,
    pl: (tw.mv + usTwd.mv) - (tw.cost + usTwd.cost),
    plRate: 0
  };
  total.plRate = total.cost > 0 ? ((total.pl / total.cost) * 100).toFixed(2) : 0;

  return { tw, usUsd, usTwd, total };
}

// 4. Import Function (Paste your CSV string here to run once)
function importHistory() {
  // PASTE YOUR DATA HERE inside the backticks
  const csvData = `
2025/02/21,102112,100701,1411,1.40%,533777.4911,534142.3889,-364.8978006,-0.07%,16290.84097,16255.56428,35.27668656,0.22%,635889.8411,634843.4789,1046.362199,0.16%,,,,,,,,,,,,,,
2025/02/22,102112,100701,1411,1.40%,555166.7191,567339.1468,-12172.42766,-2.15%,16932.00925,17267.16463,-335.1553853,-1.94%,657279.0691,668040.2368,-10761.16766,-1.61%,,,,,,,,,,,,,,
`;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let histSheet = ss.getSheetByName('History');
  if (!histSheet) { setup(); histSheet = ss.getSheetByName('History'); }

  // Clear existing data? Optional. Let's append for safety.
  // histSheet.clearContents(); 
  // setup(); // Re-add headers

  const rows = csvData.trim().split('\n');
  rows.forEach(line => {
    if (!line.trim()) return;
    // Split by comma, but handle empty trailing commas
    const parts = line.split(',');
    // We need the first 17 columns
    const rowData = parts.slice(0, 17);
    histSheet.appendRow(rowData);
  });

  console.log("Imported " + rows.length + " rows.");
}

// Run this to test permissions
function test() {
  console.log(fetchPrice('2330.TW'));
}

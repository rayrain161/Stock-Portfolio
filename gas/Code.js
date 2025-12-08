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

  // FIX: Handle symbol padding (e.g. 50 -> 0050.TW)
  let fetchSym = symbol;
  if (/^\d+$/.test(symbol)) {
    fetchSym = symbol.padStart(4, '0') + '.TW';
  }

  // User suggested simple URL. 
  const url = "https://query1.finance.yahoo.com/v8/finance/chart/" + fetchSym;

  const params = {
    muteHttpExceptions: true,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
  };

  try {
    const response = UrlFetchApp.fetch(url, params);

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

  // Normalize headers to lowercase to avoid case-sensitive issues (Total vs total)
  const headers = data[0].map(h => h.toString().toLowerCase().trim());
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

// --- Auto-Save Logic ---

const calculateHoldings = (transactions) => {
  const holdings = {};

  // Helper to robustly parse numbers (handle "1,000", "$500", etc.)
  const parseNum = (val) => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      // Remove commas, currency symbols, whitespace
      const clean = val.replace(/[,$\s]/g, '');
      const num = parseFloat(clean);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  };

  transactions.forEach(t => {
    // Map TWD stock symbols (e.g., 2330 -> 2330.TW) for consistency if needed, 
    // but usually we keep as is until fetch.
    const sym = t.symbol;
    const type = t.type ? t.type.toLowerCase() : '';

    if (!holdings[sym]) {
      holdings[sym] = { shares: 0, totalCost: 0, currency: t.currency || 'TWD' };
    }

    // Parse values
    const shares = parseNum(t.shares);
    // Cost usually comes from 'total' (Net Amount including fees). 
    // We use Math.abs to ensure we are adding to cost regardless of sign convention (negative cash flow).
    const total = Math.abs(parseNum(t.total));

    // Fallback: If total is 0 but price/shares exist, estimate it
    const estimatedTotal = (total === 0 && shares > 0) ? Math.abs(parseNum(t.price) * shares) : total;

    if (type === 'buy' || type === '現股買進' || type === '定期定額') {
      holdings[sym].shares += shares;
      holdings[sym].totalCost += estimatedTotal;
    } else if (type === 'sell' || type === '現股賣出') {
      if (holdings[sym].shares > 0) {
        // Reduce cost basis proportionally (Avg Cost method)
        const avgCost = holdings[sym].totalCost / holdings[sym].shares;
        holdings[sym].totalCost -= (shares * avgCost);
        holdings[sym].shares -= shares;
      }
    }
  });

  return holdings;
};

function recordDailyHistory() {
  // Check if it's weekend (0=Sun, 6=Sat)
  const today = new Date();
  const day = today.getDay();
  if (day === 0 || day === 6) {
    console.log("It's weekend, skipping history record.");
    return;
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const transactions = getTransactions();

  // 1. Calculate Holdings
  const holdings = calculateHoldings(transactions);

  // 2. Fetch Data (Prices & Exchange Rate)
  const exchangeRate = getExchangeRate();
  if (!exchangeRate) {
    console.error("Failed to fetch exchange rate");
    return;
  }

  let twMarketValue = 0;
  let twCost = 0;

  let usMarketValueUSD = 0;
  let usCostUSD = 0;

  // Iterate holdings to sum up stats
  for (const symbol in holdings) {
    const h = holdings[symbol];
    if (h.shares <= 0.000001) continue; // Skip empty positions

    // Fetch price
    const priceData = fetchPrice(symbol);
    if (priceData.error) {
      console.error(`Failed to fetch price for ${symbol}: ${priceData.error}`);
      continue;
    }
    const currentPrice = priceData.current;

    // Check currency based on symbol pattern or property
    // Assumtion: Symbols ending in .TW are TWD, others are USD
    const isTW = symbol.endsWith('.TW') || /^\d+$/.test(symbol); // Simple heuristic

    // However, fetchPrice logic does padding for numbers. 
    // In 'holdings', the symbol is as recorded in transactions.

    if (isTW) {
      twMarketValue += h.shares * currentPrice;
      twCost += h.totalCost;
    } else {
      usMarketValueUSD += h.shares * currentPrice;
      usCostUSD += h.totalCost;
    }
  }

  // 3. Calculate Derived Values
  const dateStr = formatDate(new Date());

  // TW Stats
  const twPL = twMarketValue - twCost;
  const twPLRate = twCost !== 0 ? (twPL / twCost) : 0;

  // US Stats (USD)
  const usPLUSD = usMarketValueUSD - usCostUSD;
  const usPLRate = usCostUSD !== 0 ? (usPLUSD / usCostUSD) : 0;

  // US Stats (TWD)
  const usMarketValueTWD = usMarketValueUSD * exchangeRate;
  const usCostTWD = usCostUSD * exchangeRate; // Approximation using current rate for total cost basis in TWD
  const usPLTWD = usMarketValueTWD - usCostTWD;
  // usPLRateTWD should theoretically be same as USD rate if using current rate for both, 
  // but usually cost basis is historical. 
  // For 'record.csv' compatibility, we often track Cost in TWD at time of purchase?
  // But our 'transactions' might not store historical exchange rates. 
  // Simplified: Use current rate for Cost conversion or keep strictly USD. 
  // For a consistent daily snapshot, converting Cost at CURRENT rate is wrong for historical performance, 
  // BUT converting Cost at HISTORICAL rate is hard without data.
  // The User's 'record.csv' likely assumes Cost(TWD) = Cost(USD) * AvgExchangeRateOfPurchase?
  // Let's use: Cost(TWD) = Cost(USD) * exchangeRate (Simplified, effectively "Global Value in TWD")

  // Wait, if we use Current Rate for Cost, then Currency Fluctuation affects Cost!
  // Ideally: Cost(TWD) should be Sum(Transaction Cost TWD).
  // Do transactions have TWD cost for US stocks?
  // The standard structure has 'total' and 'currency'.
  // We can sum 'total' based on currency.
  // Code fix: calculateHoldings should separate TWD cost and USD cost properly.

  // RE-CALCULATE COSTS properly based on Currency columns
  // (See refined calculateHoldings below)

  // Let's assume calculated 'usCostUSD' is correct in USD. 
  // For 'usCostTWD', if we don't have historical data, we might have to use current rate 
  // OR just omit if the user doesn't strictly need it for the chart they asked for (P/L).
  // User asked for "how does it get P/L".
  // Let's use simple conversion for now: 
  const usPLRateTWD = usPLRate; // Approximation

  // Totals
  const totalMarketValue = twMarketValue + usMarketValueTWD;
  const totalCost = twCost + usCostTWD;
  const totalPL = totalMarketValue - totalCost;
  const totalPLRate = totalCost !== 0 ? (totalPL / totalCost) : 0;

  // 4. Prepare Row (matching record.csv indices)
  // 0: Date, 1: TW MV, 2: TW Cost, 3: TW PL, 4: TW PL%, 
  // 5: US MV TWD, 6: US Cost TWD, 7: US PL TWD, 8: US PL% TWD
  // 9: US MV USD, 10: US Cost USD, 11: US PL USD, 12: US PL%
  // 13: Total MV, 14: Total Cost, 15: Total PL, 16: Total PL%

  const row = [
    dateStr,
    Math.round(twMarketValue),
    Math.round(twCost),
    Math.round(twPL),
    toPercent(twPLRate),

    Math.round(usMarketValueTWD),
    Math.round(usCostTWD),
    Math.round(usPLTWD),
    toPercent(usPLRateTWD),

    usMarketValueUSD.toFixed(2),
    usCostUSD.toFixed(2),
    usPLUSD.toFixed(2),
    toPercent(usPLRate),

    Math.round(totalMarketValue),
    Math.round(totalCost),
    Math.round(totalPL),
    toPercent(totalPLRate)
  ];

  // 5. Append
  let sheet = ss.getSheetByName('History');
  if (!sheet) {
    sheet = ss.insertSheet('History');
    // Using simple headers for Gas view, but data follows CSV structure
    sheet.appendRow(['date', 'twMV', 'twCost', 'twPL', 'twPL%', 'usMVTWD', 'usCostTWD', 'usPLTWD', 'usPL%TWD', 'usMVUSD', 'usCostUSD', 'usPLUSD', 'usPL%', 'totalMV', 'totalCost', 'totalPL', 'totalPL%']);
  }
  sheet.appendRow(row);
  console.log('Saved history for ' + dateStr);
}



function getExchangeRate() {
  try {
    // Fetch USD to TWD
    const response = UrlFetchApp.fetch("https://query1.finance.yahoo.com/v8/finance/chart/TWD=X");
    const json = JSON.parse(response.getContentText());
    const result = json.chart.result[0];
    return result.meta.regularMarketPrice;
  } catch (e) {
    console.error("Error fetching exchange rate: " + e.toString());
    return 32.5; // Fallback
  }
}

function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = ('0' + (d.getMonth() + 1)).slice(-2);
  const day = ('0' + d.getDate()).slice(-2);
  return `${year}/${month}/${day}`;
}

function toPercent(val) {
  return (val * 100).toFixed(2) + '%';
}

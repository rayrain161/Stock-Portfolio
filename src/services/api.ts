import type { Transaction } from '../types';

export interface Api {
  getTransactions: () => Promise<Transaction[]>;
  addTransaction: (txn: Transaction) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  getHistory: () => Promise<any[]>;
  getPrice: (symbol: string) => Promise<any>;
  importHistory: (data: any[], overwrite?: boolean) => Promise<any>;
  clearHistory: () => Promise<any>;
  importTransactions: (txns: Transaction[]) => Promise<any>;
  clearTransactions: () => Promise<void>;
}

const LOCAL_API_URL = 'http://localhost:3001/api';

const localApi: Api = {
  getTransactions: async () => {
    const res = await fetch(`${LOCAL_API_URL}/transactions`);
    if (!res.ok) throw new Error('Failed to fetch transactions');
    return res.json();
  },
  addTransaction: async (txn) => {
    const res = await fetch(`${LOCAL_API_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(txn),
    });
    if (!res.ok) throw new Error('Failed to add transaction');
    return res.json();
  },
  deleteTransaction: async (id) => {
    const res = await fetch(`${LOCAL_API_URL}/transactions/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete transaction');
  },
  clearTransactions: async () => {
    // Assuming the local server supports DELETE on the collection to clear all
    // If not, we might need to fetch all and delete one by one, but let's try this first
    // or maybe there is a specific clear endpoint?
    // Given I don't see the server code, I'll assume DELETE /transactions works or I'll try to implement a loop if I could,
    // but for now let's assume a bulk delete or just fail if not supported.
    // Actually, looking at clearHistory, it says "Not supported locally".
    // Maybe clearTransactions is also not supported locally?
    // But usePortfolio had it trying to fetch API_URL with DELETE.
    // Let's assume DELETE /transactions is the way.
    const res = await fetch(`${LOCAL_API_URL}/transactions`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to clear transactions');
  },
  getHistory: async () => {
    const res = await fetch(`${LOCAL_API_URL}/history`);
    if (!res.ok) throw new Error('Failed to fetch history');
    return res.json();
  },
  getPrice: async (symbol) => {
    // Local proxy via Vite
    const url = `/api/yahoo/chart/${symbol}?range=2d&interval=1d`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    const result = json.chart?.result?.[0];
    const meta = result?.meta;
    if (meta) {
      return { current: meta.regularMarketPrice, previousClose: meta.previousClose };
    }
    return null;
  },
  importHistory: async (data) => {
    console.warn('Import history not supported in local mode');
    return { success: false, error: 'Not supported locally' };
  },
  clearHistory: async () => {
    console.warn('Clear history not supported in local mode');
    return { success: false, error: 'Not supported locally' };
  },
  importTransactions: async (txns) => {
    console.warn('Import transactions not supported in local mode');
    return { success: false, error: 'Not supported locally' };
  }
};

const GAS_URL_KEY = 'stock_position_gas_url';

const getGasUrl = () => localStorage.getItem(GAS_URL_KEY);

export const setGasUrl = (url: string) => {
  localStorage.setItem(GAS_URL_KEY, url);
  window.location.reload(); // Reload to apply changes
};

const hybridApi: Api = {
  getTransactions: async () => {
    const gasUrl = getGasUrl();
    if (!gasUrl) {
      throw new Error('GAS_URL_MISSING');
    }

    const res = await fetch(gasUrl);
    if (!res.ok) throw new Error('Failed to fetch transactions from GAS');
    return res.json();
  },
  addTransaction: async (txn) => {
    const gasUrl = getGasUrl();
    if (!gasUrl) throw new Error('GAS_URL_MISSING');

    const res = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ op: 'add', transaction: txn }),
    });
    if (!res.ok) throw new Error('Failed to add transaction to GAS');
    return res.json();
  },
  deleteTransaction: async (id) => {
    const gasUrl = getGasUrl();
    if (!gasUrl) throw new Error('GAS_URL_MISSING');

    const res = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ op: 'delete', id }),
    });
    if (!res.ok) throw new Error('Failed to delete transaction from GAS');
  },
  clearTransactions: async () => {
    const gasUrl = getGasUrl();
    if (!gasUrl) throw new Error('GAS_URL_MISSING');

    const res = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ op: 'clearTransactions' }),
    });
    if (!res.ok) throw new Error('Failed to clear transactions in GAS');
  },
  getHistory: async () => {
    const gasUrl = getGasUrl();
    if (!gasUrl) return []; // Return empty if not configured

    const res = await fetch(`${gasUrl}?op=history`);
    if (!res.ok) throw new Error('Failed to fetch history from GAS');
    return res.json();
  },
  getPrice: async (symbol) => {
    const gasUrl = getGasUrl();
    if (!gasUrl) return null;

    const res = await fetch(`${gasUrl}?op=price&symbol=${symbol}`);
    if (!res.ok) return null;
    return res.json();
  },
  importHistory: async (data, overwrite = false) => {
    const gasUrl = getGasUrl();
    if (!gasUrl) throw new Error('GAS_URL_MISSING');

    const res = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ op: 'importHistory', historyItems: data, overwrite }),
    });
    if (!res.ok) throw new Error('Failed to import history to GAS');
    return res.json();
  },
  clearHistory: async () => {
    const gasUrl = getGasUrl();
    if (!gasUrl) throw new Error('GAS_URL_MISSING');

    const res = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ op: 'clearHistory' }),
    });
    if (!res.ok) throw new Error('Failed to clear history in GAS');
    return res.json();
  },
  importTransactions: async (txns) => {
    const gasUrl = getGasUrl();
    if (!gasUrl) throw new Error('GAS_URL_MISSING');

    const res = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ op: 'importTransactions', transactions: txns }),
    });
    if (!res.ok) throw new Error('Failed to import transactions to GAS');
    return res.json();
  }
};

// Detect environment
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// For GitHub Pages (or any non-localhost), default to hybridApi
export const api = isLocal ? localApi : hybridApi;

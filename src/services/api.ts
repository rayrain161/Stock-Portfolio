import type { Transaction } from '../types';
import { gasClient } from './gasClient';

export interface Api {
  getTransactions: () => Promise<Transaction[]>;
  addTransaction: (txn: Transaction) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  getHistory: () => Promise<any[]>;
  getPrice: (symbol: string) => Promise<any>;
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
  getHistory: async () => {
    const res = await fetch(`${LOCAL_API_URL}/history`);
    if (!res.ok) throw new Error('Failed to fetch history');
    return res.json();
  },
  getPrice: async (symbol) => {
    // Local proxy via Vite
    const url = `/api/yahoo/v8/finance/chart/${symbol}?range=2d&interval=1d`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch price locally');
    return res.json();
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
  getHistory: async () => {
    const gasUrl = getGasUrl();
    if (!gasUrl) throw new Error('GAS_URL_MISSING');

    const res = await fetch(`${gasUrl}?op=history`);
    if (!res.ok) throw new Error('Failed to fetch history from GAS');
    return res.json();
  },
  getPrice: async (symbol) => {
    const gasUrl = getGasUrl();
    if (!gasUrl) throw new Error('GAS_URL_MISSING');

    const res = await fetch(`${gasUrl}?op=price&symbol=${symbol}`);
    if (!res.ok) throw new Error('Failed to fetch price from GAS');
    return res.json();
  }
};

// Detect environment
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const api = isLocal ? localApi : hybridApi;

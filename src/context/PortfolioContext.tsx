import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { usePortfolio } from '../hooks/usePortfolio';
import type { Transaction, Holding, PortfolioStats, RealizedPosition } from '../types';
import { fetchQuote } from '../services/finnhub';
import { fetchQuoteYahoo } from '../services/yahoo';

interface PortfolioContextType {
  transactions: Transaction[];
  addTransaction: (t: Transaction) => void;
  addTransactions: (ts: Transaction[]) => Promise<void>;
  deleteTransaction: (id: string) => void;
  clearAllTransactions: () => Promise<void>;
  holdings: Holding[];
  realizedPositions: RealizedPosition[];
  stats: PortfolioStats;
  apiKey: string;
  setApiKey: (key: string) => void;
  refreshPrices: () => Promise<void>;
  exchangeRate: number;
  setExchangeRate: (rate: number) => void;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const PortfolioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const portfolio = usePortfolio();
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('finnhub_api_key') || '');
  const [exchangeRate, setExchangeRate] = useState<number>(() => {
    const saved = localStorage.getItem('usd_twd_rate');
    return saved ? parseFloat(saved) : 31.5; // Default TWD/USD rate
  });

  useEffect(() => {
    localStorage.setItem('finnhub_api_key', apiKey);
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem('usd_twd_rate', exchangeRate.toString());
  }, [exchangeRate]);

  const [refreshIndex, setRefreshIndex] = useState(0);

  // Auto-refresh logic: Sequential "Wipe" effect
  useEffect(() => {
    // Initial fetch of all prices on mount/change
    if (portfolio.holdings.length > 0) {
      refreshPrices();
    }
  }, [apiKey, portfolio.holdings.length]);

  useEffect(() => {
    if (portfolio.holdings.length === 0) return;

    const symbols = Array.from(new Set(portfolio.holdings.map(h => h.symbol))).sort();
    if (symbols.length === 0) return;

    const timer = setTimeout(async () => {
      const currentIndex = refreshIndex % symbols.length;
      const symbol = symbols[currentIndex];

      console.log(`[Auto-Refresh] Updating ${symbol} (${currentIndex + 1}/${symbols.length})...`);

      // Also refresh exchange rate occasionally? Let's do it every cycle for now or just with the first item
      if (currentIndex === 0) {
        fetchQuoteYahoo('TWD=X').then(rateData => {
          if (rateData?.current) setExchangeRate(rateData.current);
        });
      }

      try {
        await fetchSinglePrice(symbol);
      } catch (error) {
        console.error(`[Auto-Refresh] Failed to update ${symbol}:`, error);
      } finally {
        setRefreshIndex(prev => prev + 1);
      }
    }, 5000); // 5 seconds per stock

    return () => clearTimeout(timer);
  }, [refreshIndex, portfolio.holdings.length, apiKey]);

  const fetchPriceData = async (symbol: string): Promise<{ current: number; previousClose?: number } | null> => {
    let current: number | null = null;
    let previousClose: number | undefined;

    // Taiwan stocks: usually 4-6 digits. 
    // Handle cases like "50" -> "0050"
    const isDigit = /^\d+$/.test(symbol);

    if (apiKey) {
      let fetchSymbol = symbol;
      if (isDigit) {
        const padded = symbol.padStart(4, '0');
        fetchSymbol = `${padded}.TW`;
      }
      current = await fetchQuote(fetchSymbol, apiKey);
    }

    if (current === null) {
      // Try Yahoo Finance via GAS
      if (isDigit) {
        const padded = symbol.padStart(4, '0');
        // Try .TW first
        let yahooData = await fetchQuoteYahoo(`${padded}.TW`);
        // If .TW fails, try .TWO (for OTC stocks)
        if (!yahooData) {
          yahooData = await fetchQuoteYahoo(`${padded}.TWO`);
        }
        if (yahooData) {
          current = yahooData.current;
          previousClose = yahooData.previousClose;
        }
      } else {
        // For non-Taiwan stocks, use symbol as-is
        const yahooData = await fetchQuoteYahoo(symbol);
        if (yahooData) {
          current = yahooData.current;
          previousClose = yahooData.previousClose;
        }
      }
    }

    if (current !== null) {
      return { current, previousClose };
    }
    return null;
  };

  const fetchSinglePrice = async (symbol: string) => {
    const data = await fetchPriceData(symbol);
    if (data) {
      portfolio.updatePrice(symbol, data.current, data.previousClose);
    } else {
      console.warn(`Failed to fetch price for ${symbol}`);
    }
  };

  const refreshPrices = async () => {
    const symbols = Array.from(new Set(portfolio.holdings.map(h => h.symbol)));

    // Fetch USD/TWD exchange rate
    console.log('Fetching USD/TWD exchange rate...');
    const rateData = await fetchQuoteYahoo('TWD=X');
    if (rateData?.current) {
      setExchangeRate(rateData.current);
      console.log(`Exchange rate updated: 1 USD = ${rateData.current} TWD`);
    }

    // Batch fetch all prices
    const results = await Promise.all(symbols.map(async (symbol) => {
      const data = await fetchPriceData(symbol);
      return { symbol, data };
    }));

    // Batch update state
    const newPrices: Record<string, { current: number; previousClose?: number }> = {};
    results.forEach(({ symbol, data }) => {
      if (data) {
        newPrices[symbol] = data;
      }
    });

    if (Object.keys(newPrices).length > 0) {
      portfolio.updatePrices(newPrices);
    }
  };

  return (
    <PortfolioContext.Provider value={{ ...portfolio, apiKey, setApiKey, refreshPrices, exchangeRate, setExchangeRate }}>
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolioContext = () => {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error('usePortfolioContext must be used within a PortfolioProvider');
  }
  return context;
};

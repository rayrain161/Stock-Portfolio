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

  // Auto-refresh on mount, regardless of apiKey
  useEffect(() => {
    refreshPrices();

    const intervalId = setInterval(() => {
      console.log('Auto-refreshing prices...');
      refreshPrices();
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [apiKey, portfolio.holdings.length]); // Re-run if apiKey changes or holdings change

  const refreshPrices = async () => {
    const symbols = Array.from(new Set(portfolio.holdings.map(h => h.symbol)));

    // Fetch USD/TWD exchange rate
    console.log('Fetching USD/TWD exchange rate...');
    const rateData = await fetchQuoteYahoo('TWD=X');
    if (rateData?.current) {
      setExchangeRate(rateData.current);
      console.log(`Exchange rate updated: 1 USD = ${rateData.current} TWD`);
    }

    await Promise.all(symbols.map(async (symbol) => {
      let current: number | null = null;
      let previousClose: number | undefined;

      // Taiwan stocks: usually 4-6 digits. 
      // Handle cases like "50" -> "0050"
      const isDigit = /^\d+$/.test(symbol);

      console.log(`[refreshPrices] symbol="${symbol}", isDigit=${isDigit}`);

      if (apiKey) {
        let fetchSymbol = symbol;
        if (isDigit) {
          // Pad to 4 digits if needed for Finnhub? Finnhub usually expects 2330.TW
          // If user entered "50", we might need "0050.TW"
          const padded = symbol.padStart(4, '0');
          fetchSymbol = `${padded}.TW`;
        }
        current = await fetchQuote(fetchSymbol, apiKey);
      }

      if (current === null) {
        // Try Yahoo Finance via GAS
        if (isDigit) {
          // Pad to 4 digits for Yahoo (e.g. 50 -> 0050.TW)
          const padded = symbol.padStart(4, '0');

          // Try .TW first
          console.log(`Attempting to fetch ${padded}.TW from Yahoo Finance...`);
          let yahooData = await fetchQuoteYahoo(`${padded}.TW`);

          // If .TW fails, try .TWO (for OTC stocks)
          if (!yahooData) {
            console.log(`${padded}.TW not found, trying ${padded}.TWO...`);
            yahooData = await fetchQuoteYahoo(`${padded}.TWO`);
          }

          if (yahooData) {
            current = yahooData.current;
            previousClose = yahooData.previousClose;
          }
        } else {
          // For non-Taiwan stocks, use symbol as-is
          console.log(`Attempting to fetch ${symbol} from Yahoo Finance...`);
          const yahooData = await fetchQuoteYahoo(symbol);
          if (yahooData) {
            current = yahooData.current;
            previousClose = yahooData.previousClose;
          }
        }
      }

      if (current !== null) {
        portfolio.updatePrice(symbol, current, previousClose);
      } else {
        console.warn(`Failed to fetch price for ${symbol}`);
      }
    }));
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

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { usePortfolio } from '../hooks/usePortfolio';
import type { Transaction, Holding, PortfolioStats, RealizedPosition } from '../types';
import { fetchQuote } from '../services/finnhub';
import { fetchQuoteYahoo } from '../services/yahoo';

interface PortfolioContextType {
  transactions: Transaction[];
  addTransaction: (t: Transaction) => void;
  deleteTransaction: (id: string) => void;
  holdings: Holding[];
  realizedPositions: RealizedPosition[];
  stats: PortfolioStats;
  apiKey: string;
  setApiKey: (key: string) => void;
  refreshPrices: () => Promise<void>;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const PortfolioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const portfolio = usePortfolio();
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('finnhub_api_key') || '');

  useEffect(() => {
    localStorage.setItem('finnhub_api_key', apiKey);
  }, [apiKey]);

  const refreshPrices = async () => {
    const symbols = Array.from(new Set(portfolio.holdings.map(h => h.symbol)));

    await Promise.all(symbols.map(async (symbol) => {
      let current: number | null = null;
      let previousClose: number | undefined;

      // Taiwan stocks can be 4-6 digits (e.g., 2330, 0050, 00878, 006208)
      const isTwStock = /^\d{4,6}$/.test(symbol);

      console.log(`[refreshPrices] symbol="${symbol}", isTwStock=${isTwStock}, length=${symbol.length}`);

      if (apiKey) {
        const fetchSymbol = isTwStock ? `${symbol}.TW` : symbol;
        current = await fetchQuote(fetchSymbol, apiKey);
      }

      if (current === null) {
        // Try Yahoo Finance with different suffixes for Taiwan stocks
        if (isTwStock) {
          // Try .TW first
          console.log(`Attempting to fetch ${symbol}.TW from Yahoo Finance...`);
          let yahooData = await fetchQuoteYahoo(`${symbol}.TW`);

          // If .TW fails, try .TWO (for OTC stocks)
          if (!yahooData) {
            console.log(`${symbol}.TW not found, trying ${symbol}.TWO...`);
            yahooData = await fetchQuoteYahoo(`${symbol}.TWO`);
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
      }
    }));
  };

  // Auto-refresh on mount if key exists
  useEffect(() => {
    if (apiKey) {
      refreshPrices();
    }
  }, [apiKey]); // Depend on apiKey so it runs when key is set

  return (
    <PortfolioContext.Provider value={{ ...portfolio, apiKey, setApiKey, refreshPrices }}>
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

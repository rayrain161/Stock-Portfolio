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
  exchangeRate: number;
  setExchangeRate: (rate: number) => void;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const PortfolioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [exchangeRate, setExchangeRate] = useState<number>(() => {
    const saved = localStorage.getItem('usd_twd_exchange_rate');
    return saved ? parseFloat(saved) : 31.25; // Default TWD per USD
  });

  const portfolio = usePortfolio(exchangeRate);
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('finnhub_api_key') || '');

  useEffect(() => {
    localStorage.setItem('finnhub_api_key', apiKey);
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem('usd_twd_exchange_rate', exchangeRate.toString());
  }, [exchangeRate]);

  const refreshPrices = async () => {
    const symbols = Array.from(new Set(portfolio.transactions.map((t) => t.symbol)));

    for (const symbol of symbols) {
      let normalizedSymbol = symbol;
      if (/^\d{4}$/.test(symbol)) {
        normalizedSymbol = `${symbol}.TW`;
      }

      try {
        if (apiKey) {
          const quote = await fetchQuote(normalizedSymbol, apiKey);
          if (quote?.c) {
            portfolio.updatePrice(symbol, quote.c);
            continue;
          }
        }

        const yahooQuote = await fetchQuoteYahoo(normalizedSymbol);
        if (yahooQuote?.regularMarketPrice) {
          portfolio.updatePrice(symbol, yahooQuote.regularMarketPrice);
        }
      } catch (error) {
        console.error(`Failed to fetch price for ${symbol}:`, error);
      }
    }
  };

  // Auto-refresh on mount if key exists
  useEffect(() => {
    if (apiKey) {
      refreshPrices();
    }
  }, [apiKey]); // Depend on apiKey so it runs when key is set

  return (
    <PortfolioContext.Provider
      value={{
        ...portfolio,
        apiKey,
        setApiKey,
        refreshPrices,
        exchangeRate,
        setExchangeRate,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolioContext = (): PortfolioContextType => {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolioContext must be used within a PortfolioProvider');
  }
  return context;
};

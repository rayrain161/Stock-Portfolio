import { useState, useEffect, useMemo } from 'react';
import type { Transaction, Holding, PortfolioStats, RealizedPosition } from '../types';

import { api } from '../services/api';

interface PriceInfo {
  current: number;
  previousClose?: number;
}

export const usePortfolio = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [prices, setPrices] = useState<Record<string, PriceInfo>>({});

  // Fetch transactions from API on mount
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        // 1. Check for Embedded Data (Standalone Mode)
        if ((window as any).INITIAL_DATA?.transactions) {
          console.log('Using embedded initial data');
          setTransactions((window as any).INITIAL_DATA.transactions);
          return;
        }

        // 2. Fetch from API (Local or GAS)
        const data = await api.getTransactions();
        setTransactions(data);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      }
    };

    fetchTransactions();
  }, []);

  const addTransaction = async (transaction: Transaction) => {
    console.log('addTransaction called with:', transaction);
    try {
      const savedTransaction = await api.addTransaction(transaction);
      console.log('Transaction saved, updating state:', savedTransaction);
      // If GAS returns null/undefined for some reason, use the input transaction
      setTransactions((prev) => [...prev, savedTransaction || transaction]);
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  };

  const addTransactions = async (newTransactions: Transaction[]) => {
    try {
      const savedTransactions: Transaction[] = [];

      // Process sequentially
      for (const transaction of newTransactions) {
        try {
          const saved = await api.addTransaction(transaction);
          savedTransactions.push(saved || transaction);
        } catch (e) {
          console.error('Failed to save transaction:', transaction, e);
        }
      }

      if (savedTransactions.length > 0) {
        setTransactions((prev) => [...prev, ...savedTransactions]);
      }
    } catch (error) {
      console.error('Error saving transactions:', error);
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await api.deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const clearAllTransactions = async () => {
    try {
      await api.clearTransactions();
      setTransactions([]);
    } catch (error) {
      console.error('Error clearing transactions:', error);
    }
  };

  const updatePrice = (symbol: string, current: number, previousClose?: number) => {
    setPrices((prev) => ({ ...prev, [symbol]: { current, previousClose } }));
  };

  const updatePrices = (newPrices: Record<string, PriceInfo>) => {
    setPrices((prev) => ({ ...prev, ...newPrices }));
  };

  // Calculate holdings and realized gains using FIFO
  const { holdings: calculatedHoldings, realizedPositions, totalRealizedPL } = useMemo(() => {
    const holdingsMap: Record<string, {
      symbol: string;
      broker: string;
      totalShares: number;
      totalCost: number;
      lots: Array<{ shares: number; price: number; fee: number; date: string }>;
    }> = {};

    const realizedPositions: RealizedPosition[] = [];
    let totalRealizedPL = 0;

    const sortedTxns = [...transactions].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    sortedTxns.forEach((txn) => {
      const key = `${txn.symbol}-${txn.broker}`;

      if (!holdingsMap[key]) {
        holdingsMap[key] = {
          symbol: txn.symbol,
          broker: txn.broker,
          totalShares: 0,
          totalCost: 0,
          lots: [],
        };
      }

      const holding = holdingsMap[key];

      // Ensure values are numbers
      const shares = Number(txn.shares);
      const price = Number(txn.price);
      const fee = Number(txn.fee);

      if (txn.type === 'Buy') {
        holding.lots.push({
          shares: shares,
          price: price,
          fee: fee,
          date: txn.date,
        });
        holding.totalShares += shares;
        holding.totalCost += (shares * price) + fee;
      } else {
        let sharesToSell = shares;
        const sellPricePerShare = price;
        const sellFeePerShare = fee / shares;

        while (sharesToSell > 0 && holding.lots.length > 0) {
          const lot = holding.lots[0];
          const sharesToTake = Math.min(sharesToSell, lot.shares);

          const acquisitionPrice = lot.price;
          const acquisitionFeeForPortion = (lot.fee / lot.shares) * sharesToTake;
          const saleFeeForPortion = sellFeePerShare * sharesToTake;

          const adjustedCost = (acquisitionPrice * sharesToTake) + acquisitionFeeForPortion;
          const salesProceeds = (sellPricePerShare * sharesToTake) - saleFeeForPortion;
          const netGainLoss = salesProceeds - adjustedCost;

          const daysHeld = Math.floor(
            (new Date(txn.date).getTime() - new Date(lot.date).getTime()) / (1000 * 60 * 60 * 24)
          );

          realizedPositions.push({
            symbol: txn.symbol,
            broker: txn.broker,
            quantity: sharesToTake,
            dateAcquired: lot.date,
            dateSold: txn.date,
            daysHeld,
            acquisitionPrice,
            acquisitionFee: acquisitionFeeForPortion,
            salePrice: sellPricePerShare,
            saleFee: saleFeeForPortion,
            adjustedCost,
            salesProceeds,
            netGainLoss,
            gainLossPercent: (netGainLoss / adjustedCost) * 100,
            isShortTerm: daysHeld < 365,
          });

          totalRealizedPL += netGainLoss;

          lot.shares -= sharesToTake;
          holding.totalShares -= sharesToTake;
          holding.totalCost -= adjustedCost;
          sharesToSell -= sharesToTake;

          if (lot.shares === 0) {
            holding.lots.shift();
          }
        }
      }
    });

    const calculatedHoldings: Holding[] = Object.values(holdingsMap)
      .filter((h) => h.totalShares > 0.000001)
      .map((h) => {
        const priceInfo = prices[h.symbol];
        const currentPrice = priceInfo?.current;
        const previousClose = priceInfo?.previousClose;

        // Calculate day change if we have both current and previous prices
        let dayChange: number | undefined;
        let dayChangePercent: number | undefined;

        if (currentPrice && previousClose) {
          const priceChange = currentPrice - previousClose;
          dayChange = priceChange * h.totalShares; // Total $ change for this holding
          dayChangePercent = (priceChange / previousClose) * 100;
        }

        const price = currentPrice || h.totalCost / h.totalShares;
        const totalCost = h.totalCost;
        const marketValue = h.totalShares * price;
        const unrealizedPL = marketValue - totalCost;
        const unrealizedPLPercent = totalCost > 0 ? (unrealizedPL / totalCost) * 100 : 0;

        return {
          symbol: h.symbol,
          broker: h.broker as any,
          shares: h.totalShares,
          avgCost: h.totalCost / h.totalShares,
          currentPrice,
          totalCost,
          marketValue,
          unrealizedPL,
          unrealizedPLPercent,
          dayChange,
          dayChangePercent,
        };
      });

    return {
      holdings: calculatedHoldings,
      realizedPositions,
      totalRealizedPL,
    };
  }, [transactions, prices]);

  const stats: PortfolioStats = useMemo(() => {
    let totalValue = 0;
    let totalCost = 0;
    let totalUnrealizedPL = 0;

    calculatedHoldings.forEach((h) => {
      const price = h.currentPrice || h.avgCost;
      const value = h.shares * price;
      const cost = h.shares * h.avgCost;

      totalValue += value;
      totalCost += cost;
      totalUnrealizedPL += (value - cost);
    });

    return {
      totalValue,
      totalCost,
      totalUnrealizedPL,
      totalUnrealizedPLPercent: totalCost > 0 ? (totalUnrealizedPL / totalCost) * 100 : 0,
      totalRealizedPL,
    };
  }, [calculatedHoldings, totalRealizedPL]);

  return {
    transactions,
    addTransaction,
    addTransactions,
    deleteTransaction,
    clearAllTransactions,
    updatePrice,
    updatePrices,
    holdings: calculatedHoldings,
    realizedPositions,
    stats,
  };
};

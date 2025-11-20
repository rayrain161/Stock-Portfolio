import { useState, useEffect, useMemo } from 'react';
import type { Transaction, Holding, PortfolioStats, RealizedPosition } from '../types';

const STORAGE_KEY = 'stock_position_transactions';

interface PriceInfo {
  current: number;
  previousClose?: number;
}

export const usePortfolio = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [prices, setPrices] = useState<Record<string, PriceInfo>>({});

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  }, [transactions]);

  const addTransaction = (transaction: Transaction) => {
    setTransactions((prev) => [...prev, transaction]);
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const updatePrice = (symbol: string, current: number, previousClose?: number) => {
    setPrices((prev) => ({ ...prev, [symbol]: { current, previousClose } }));
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

      if (txn.type === 'Buy') {
        holding.lots.push({
          shares: txn.shares,
          price: txn.price,
          fee: txn.fee,
          date: txn.date,
        });
        holding.totalShares += txn.shares;
        holding.totalCost += (txn.shares * txn.price) + txn.fee;
      } else {
        let sharesToSell = txn.shares;
        const sellPricePerShare = txn.price;
        const sellFeePerShare = txn.fee / txn.shares;

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
      .filter((h) => h.totalShares > 0)
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
    deleteTransaction,
    updatePrice,
    holdings: calculatedHoldings,
    realizedPositions,
    stats,
  };
};

import React from 'react';
import { usePortfolioContext } from '../context/PortfolioContext';
import { clsx } from 'clsx';
import type { Holding } from '../types';

interface HoldingsTableProps {
  holdings?: Holding[];
}

export const HoldingsTable: React.FC<HoldingsTableProps> = ({ holdings: propHoldings }) => {
  const { holdings: contextHoldings } = usePortfolioContext();
  const holdings = propHoldings || contextHoldings;

  if (holdings.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-[#787b86]">No holdings yet. Add a transaction to get started.</p>
      </div>
    );
  }

  return (
    <table className="w-full text-left text-xs">
      <thead>
        <tr className="border-b border-[#2a2e39] text-[#787b86]">
          <th className="px-4 py-2 font-medium uppercase tracking-wider">Symbol</th>
          <th className="px-4 py-2 font-medium uppercase tracking-wider text-right">Quantity</th>
          <th className="px-4 py-2 font-medium uppercase tracking-wider text-right">Last Price</th>
          <th className="px-4 py-2 font-medium uppercase tracking-wider text-right">Change</th>
          <th className="px-4 py-2 font-medium uppercase tracking-wider text-right">Market Value</th>
          <th className="px-4 py-2 font-medium uppercase tracking-wider text-right">Unit Cost</th>
          <th className="px-4 py-2 font-medium uppercase tracking-wider text-right">Total Cost</th>
          <th className="px-4 py-2 font-medium uppercase tracking-wider text-right">Gain/Loss</th>
          <th className="px-4 py-2 font-medium uppercase tracking-wider text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[#2a2e39]">
        {holdings.map((holding) => {
          const price = holding.currentPrice || holding.avgCost;
          const marketValue = holding.shares * price;
          const totalCost = holding.shares * holding.avgCost;
          const pl = marketValue - totalCost;
          const plPercent = totalCost > 0 ? (pl / totalCost) * 100 : 0;

          // Mock day change for visual completeness (since we don't have real data yet)
          const dayChange = (price * 0.015);
          const dayChangePercent = 1.5;

          return (
            <tr key={`${holding.broker}-${holding.symbol}`} className="hover:bg-[#2a2e39] transition-colors group">
              <td className="px-4 py-2">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-[#2962ff] rounded-full"></div>
                  <span className="font-bold text-[#d1d4dc]">{holding.symbol}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2a2e39] text-[#787b86]">{holding.broker}</span>
                </div>
              </td>
              <td className="px-4 py-2 text-right text-[#d1d4dc] font-mono">{holding.shares.toLocaleString()}</td>
              <td className="px-4 py-2 text-right text-[#d1d4dc] font-mono">${price.toFixed(2)}</td>
              <td className="px-4 py-2 text-right font-mono">
                <span className="text-[#00b498]">+{dayChange.toFixed(2)} (+{dayChangePercent}%)</span>
              </td>
              <td className="px-4 py-2 text-right font-medium text-[#d1d4dc] font-mono">${marketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td className="px-4 py-2 text-right text-[#787b86] font-mono">${holding.avgCost.toFixed(2)}</td>
              <td className="px-4 py-2 text-right text-[#787b86] font-mono">${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td className={clsx(
                "px-4 py-2 text-right font-medium font-mono",
                pl >= 0 ? "text-[#00b498]" : "text-[#e22a19]"
              )}>
                <div className="flex flex-col items-end leading-tight">
                  <span>{pl >= 0 ? '+' : ''}{pl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <span className="text-[10px] opacity-80">{plPercent >= 0 ? '+' : ''}{plPercent.toFixed(2)}%</span>
                </div>
              </td>
              <td className="px-4 py-2 text-right">
                <button className="text-[#2962ff] hover:text-white text-[10px] font-medium uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity">
                  Trade
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

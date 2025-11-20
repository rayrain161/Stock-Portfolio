import React, { useState, useMemo } from 'react';
import { usePortfolioContext } from '../context/PortfolioContext';
import { clsx } from 'clsx';
import { ArrowUp, ArrowDown } from 'lucide-react';
import type { Holding } from '../types';

interface HoldingsTableProps {
  holdings?: Holding[];
}

type SortKey = 'symbol' | 'shares' | 'price' | 'dayChange' | 'marketValue' | 'avgCost' | 'totalCost' | 'pl';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

export const HoldingsTable: React.FC<HoldingsTableProps> = ({ holdings: propHoldings }) => {
  const { holdings: contextHoldings } = usePortfolioContext();
  const holdings = propHoldings || contextHoldings;
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'marketValue', direction: 'desc' });

  const handleSort = (key: SortKey) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const sortedHoldings = useMemo(() => {
    const sorted = [...holdings];
    sorted.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case 'symbol':
          aValue = a.symbol;
          bValue = b.symbol;
          break;
        case 'shares':
          aValue = a.shares;
          bValue = b.shares;
          break;
        case 'price':
          aValue = a.currentPrice || a.avgCost;
          bValue = b.currentPrice || b.avgCost;
          break;
        case 'dayChange':
          aValue = a.dayChange || 0;
          bValue = b.dayChange || 0;
          break;
        case 'marketValue':
          aValue = a.shares * (a.currentPrice || a.avgCost);
          bValue = b.shares * (b.currentPrice || b.avgCost);
          break;
        case 'avgCost':
          aValue = a.avgCost;
          bValue = b.avgCost;
          break;
        case 'totalCost':
          aValue = a.totalCost;
          bValue = b.totalCost;
          break;
        case 'pl':
          aValue = (a.shares * (a.currentPrice || a.avgCost)) - a.totalCost;
          bValue = (b.shares * (b.currentPrice || b.avgCost)) - b.totalCost;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [holdings, sortConfig]);

  if (holdings.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-[#787b86]">No holdings yet. Add a transaction to get started.</p>
      </div>
    );
  }

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortConfig.key !== columnKey) return <div className="w-3 h-3" />; // Placeholder
    return sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
  };

  const HeaderCell = ({ label, sortKey, align = 'right' }: { label: string, sortKey: SortKey, align?: 'left' | 'right' }) => (
    <th
      className={clsx(
        "px-4 py-2 font-medium uppercase tracking-wider cursor-pointer hover:text-[#d1d4dc] transition-colors select-none",
        align === 'right' ? "text-right" : "text-left"
      )}
      onClick={() => handleSort(sortKey)}
    >
      <div className={clsx("flex items-center gap-1", align === 'right' ? "justify-end" : "justify-start")}>
        {label}
        <SortIcon columnKey={sortKey} />
      </div>
    </th>
  );

  return (
    <table className="w-full text-left text-xs">
      <thead>
        <tr className="border-b border-[#2a2e39] text-[#787b86]">
          <HeaderCell label="Symbol" sortKey="symbol" align="left" />
          <HeaderCell label="Quantity" sortKey="shares" />
          <HeaderCell label="Last Price" sortKey="price" />
          <HeaderCell label="Change" sortKey="dayChange" />
          <HeaderCell label="Market Value" sortKey="marketValue" />
          <HeaderCell label="Unit Cost" sortKey="avgCost" />
          <HeaderCell label="Total Cost" sortKey="totalCost" />
          <HeaderCell label="Gain/Loss" sortKey="pl" />
          <th className="px-4 py-2 font-medium uppercase tracking-wider text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[#2a2e39]">
        {sortedHoldings.map((holding) => {
          const price = holding.currentPrice || holding.avgCost;
          const marketValue = holding.shares * price;
          const totalCost = holding.shares * holding.avgCost;
          const pl = marketValue - totalCost;
          const plPercent = totalCost > 0 ? (pl / totalCost) * 100 : 0;

          // Use day change from holding if available
          const dayChange = holding.dayChange || 0;
          const dayChangePercent = holding.dayChangePercent || 0;

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
              <td className={clsx(
                "px-4 py-2 text-right font-mono",
                dayChange >= 0 ? "text-[#00b498]" : "text-[#e22a19]"
              )}>
                {dayChange >= 0 ? '+' : ''}{dayChange.toFixed(2)} ({dayChange >= 0 ? '+' : ''}{dayChangePercent.toFixed(2)}%)
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

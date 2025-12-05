import React, { useState } from 'react';
import { usePortfolioContext } from '../context/PortfolioContext';
import { setGasUrl } from '../services/api';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { HoldingsTable } from './HoldingsTable';
import { HistoricalAnalysis } from './HistoricalAnalysis';

import { clsx } from 'clsx';
import { RefreshCw, Settings } from 'lucide-react';
import type { Broker } from '../types';

const COLORS = ['#2962ff', '#e22a19', '#00b498', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'];

interface DashboardProps {
  onNewTrade?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNewTrade }) => {
  const { stats, holdings, refreshPrices, apiKey, exchangeRate } = usePortfolioContext();
  const [showSettings, setShowSettings] = useState(false);
  const [gasUrlInput, setGasUrlInput] = useState('');

  // Check if we need GAS URL
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const hasGasUrl = !!localStorage.getItem('stock_position_gas_url');
  const needsConfig = !isLocal && !hasGasUrl;

  const handleSaveGasUrl = () => {
    if (gasUrlInput) {
      setGasUrl(gasUrlInput);
    }
  };

  if (needsConfig) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#131722] text-[#d1d4dc] p-4">
        <div className="bg-[#1e222d] p-8 rounded-xl shadow-lg max-w-md w-full">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#2962ff]" />
            Setup Connection
          </h2>
          <p className="text-[#787b86] mb-6">
            To connect to your Google Sheet, please enter the <strong>Web App URL</strong> you got from Google Apps Script.
          </p>
          <input
            type="text"
            value={gasUrlInput}
            onChange={(e) => setGasUrlInput(e.target.value)}
            placeholder="https://script.google.com/macros/s/..."
            className="w-full bg-[#2a2e39] border border-[#363a45] rounded-lg px-4 py-2 text-[#d1d4dc] mb-4 focus:outline-none focus:border-[#2962ff]"
          />
          <button
            onClick={handleSaveGasUrl}
            className="w-full bg-[#2962ff] hover:bg-[#1e53e5] text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Connect
          </button>
        </div>
      </div>
    );
  }
  const [allocationType, setAllocationType] = React.useState<'symbol' | 'broker'>('symbol');
  const [brokerFilter, setBrokerFilter] = React.useState<'all' | Broker>('all');
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshPrices();
    setIsRefreshing(false);
  };

  // Filter holdings based on selected broker
  const filteredHoldings = React.useMemo(() => {
    if (brokerFilter === 'all') return holdings;
    return holdings.filter(h => h.broker === brokerFilter);
  }, [holdings, brokerFilter]);

  // Calculate filtered stats
  const filteredStats = React.useMemo(() => {
    let totalValue = 0;
    let totalCost = 0;
    let totalUnrealizedPL = 0;
    let totalDayChange = 0;

    filteredHoldings.forEach((h) => {
      const price = h.currentPrice || h.avgCost;
      let value = h.shares * price;
      let cost = h.shares * h.avgCost;
      let dayChange = h.dayChange || 0;

      // Convert USD to TWD only if we are viewing ALL assets (to aggregate)
      // If viewing specific USD broker (FubonSub, Firstrade), keep in USD
      if (brokerFilter === 'all' && h.broker !== 'FubonTW') {
        value *= exchangeRate;
        cost *= exchangeRate;
        dayChange *= exchangeRate;
      }

      totalValue += value;
      totalCost += cost;
      totalUnrealizedPL += (value - cost);
      totalDayChange += dayChange;
    });

    const totalDayChangePercent = (totalValue - totalDayChange) > 0
      ? (totalDayChange / (totalValue - totalDayChange)) * 100
      : 0;

    return {
      totalValue,
      totalCost,
      totalUnrealizedPL,
      totalUnrealizedPLPercent: totalCost > 0 ? (totalUnrealizedPL / totalCost) * 100 : 0,
      totalDayChange,
      totalDayChangePercent,
    };
  }, [filteredHoldings, exchangeRate, brokerFilter]);

  const allocationData = React.useMemo(() => {
    if (allocationType === 'symbol') {
      return filteredHoldings.map(h => {
        let value = h.shares * (h.currentPrice || h.avgCost);
        // Always convert to TWD for allocation chart to show relative size correctly
        if (h.broker !== 'FubonTW') {
          value *= exchangeRate;
        }
        return {
          name: h.symbol,
          value: value,
        };
      }).sort((a, b) => b.value - a.value);
    } else {
      const brokerMap = new Map<string, number>();
      filteredHoldings.forEach(h => {
        let value = h.shares * (h.currentPrice || h.avgCost);
        // Always convert to TWD for allocation chart
        if (h.broker !== 'FubonTW') {
          value *= exchangeRate;
        }
        brokerMap.set(h.broker, (brokerMap.get(h.broker) || 0) + value);
      });
      return Array.from(brokerMap.entries()).map(([name, value]) => ({
        name,
        value
      })).sort((a, b) => b.value - a.value);
    }
  }, [filteredHoldings, allocationType, exchangeRate]);

  const SummaryItem = ({ label, value, subValue, color = '#d1d4dc' }: any) => (
    <div className="flex flex-col">
      <span className="text-[#787b86] text-xs font-medium uppercase tracking-wide mb-1">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold font-mono tracking-tight" style={{ color }}>{value}</span>
        {subValue && <span className="text-sm font-medium">{subValue}</span>}
      </div>
    </div>
  );

  const currencyLabel = (brokerFilter === 'FubonSub' || brokerFilter === 'Firstrade') ? 'USD' : 'TWD';

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Broker Filter Tabs */}
      <div className="bg-[#1e222d] border border-[#2a2e39] rounded p-2">
        <div className="flex gap-2">
          {[
            { id: 'all', label: '全部' },
            { id: 'FubonTW', label: '台股' },
            { id: 'FubonSub', label: '複委託' },
            { id: 'Firstrade', label: 'Firstrade' },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setBrokerFilter(filter.id as 'all' | Broker)}
              className={clsx(
                'flex-1 px-4 py-2 text-sm font-medium rounded transition-colors',
                brokerFilter === filter.id
                  ? 'bg-[#2962ff] text-white'
                  : 'text-[#787b86] hover:bg-[#2a2e39] hover:text-[#d1d4dc]'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Strip */}
      <div className="bg-[#1e222d] border border-[#2a2e39] p-4 lg:p-6 rounded flex flex-col lg:flex-row items-start lg:items-center justify-between shadow-sm gap-4 lg:gap-0">
        <div className="flex flex-wrap gap-6 lg:gap-12 w-full lg:w-auto">
          <SummaryItem
            label={`Total Assets (${currencyLabel})`}
            value={`$${filteredStats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            color="#d1d4dc"
          />
          <SummaryItem
            label="Day Change"
            value={`${filteredStats.totalDayChange >= 0 ? '+' : '-'}$${Math.abs(filteredStats.totalDayChange).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subValue={`(${filteredStats.totalDayChange >= 0 ? '+' : ''}${filteredStats.totalDayChangePercent.toFixed(2)}%)`}
            color={filteredStats.totalDayChange >= 0 ? '#00b498' : '#e22a19'}
          />
          <SummaryItem
            label={`Total P/L (${currencyLabel})`}
            value={`${filteredStats.totalUnrealizedPL >= 0 ? '+' : '-'}$${Math.abs(filteredStats.totalUnrealizedPL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subValue={`(${filteredStats.totalUnrealizedPLPercent.toFixed(2)}%)`}
            color={filteredStats.totalUnrealizedPL >= 0 ? '#00b498' : '#e22a19'}
          />
          <div className="flex flex-col">
            <span className="text-[#787b86] text-xs font-medium uppercase tracking-wide mb-1">USD/TWD</span>
            <span className="text-lg font-bold font-mono tracking-tight text-[#d1d4dc]">{exchangeRate.toFixed(2)}</span>
          </div>
        </div>
        <div className="flex gap-2 w-full lg:w-auto justify-end">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3 py-1.5 bg-[#2a2e39] hover:bg-[#363a45] text-[#d1d4dc] text-sm font-medium rounded transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={clsx("w-4 h-4", isRefreshing && "animate-spin")} />
            {isRefreshing ? 'Updating...' : 'Refresh Prices'}
          </button>
          {onNewTrade && (
            <button
              onClick={onNewTrade}
              className="px-3 py-1.5 bg-[#2962ff] hover:bg-[#1e53dc] text-white text-sm font-medium rounded transition-colors"
            >
              New Trade
            </button>
          )}
        </div>
      </div>


      <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Holdings List (Left/Main) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col min-h-0">
          <div className="bg-[#1e222d] border border-[#2a2e39] rounded flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-[#2a2e39] flex justify-between items-center">
              <h3 className="text-[#d1d4dc] font-medium">Account Positions</h3>
            </div>
            <div className="flex-1 overflow-auto">
              <HoldingsTable holdings={filteredHoldings} />
            </div>
          </div>
        </div>

        {/* Charts / Allocation (Right) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="bg-[#1e222d] border border-[#2a2e39] rounded p-4 h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[#d1d4dc] font-medium">Allocation</h3>
              <div className="flex bg-[#131722] rounded p-0.5 border border-[#2a2e39]">
                <button
                  onClick={() => setAllocationType('symbol')}
                  className={clsx(
                    "px-2 py-1 text-[10px] font-medium rounded transition-colors",
                    allocationType === 'symbol' ? "bg-[#2a2e39] text-[#d1d4dc]" : "text-[#787b86] hover:text-[#d1d4dc]"
                  )}
                >
                  Symbol
                </button>
                <button
                  onClick={() => setAllocationType('broker')}
                  className={clsx(
                    "px-2 py-1 text-[10px] font-medium rounded transition-colors",
                    allocationType === 'broker' ? "bg-[#2a2e39] text-[#d1d4dc]" : "text-[#787b86] hover:text-[#d1d4dc]"
                  )}
                >
                  Broker
                </button>
              </div>
            </div>
            <div className="flex-1 relative">
              {allocationData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={115}
                      paddingAngle={0}
                      dataKey="value"
                      stroke="none"
                      label={(entry: any) => {
                        const percent = entry.percent;
                        return percent && percent > 0.05 ? entry.name : '';
                      }}
                      labelLine={false}
                    >
                      {allocationData.map((entry, index) => (
                        <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#131722', borderColor: '#2a2e39', borderRadius: '4px', color: '#d1d4dc' }}
                      itemStyle={{ color: '#d1d4dc' }}
                      formatter={(value: number, name: string) => {
                        const total = allocationData.reduce((sum, item) => sum + item.value, 0);
                        const percent = ((value / total) * 100).toFixed(2);
                        return [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${percent}%)`, name];
                      }}
                    />
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                      <tspan x="50%" dy="-0.5em" fontSize="11" fill="#787b86">Total Assets</tspan>
                      <tspan x="50%" dy="1.3em" fontSize="16" fontWeight="bold" fill="#d1d4dc">
                        ${filteredStats.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </tspan>
                    </text>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-[#787b86] gap-2">
                  <PieChart className="w-12 h-12 opacity-20" />
                  <p>No assets to display</p>
                </div>
              )}
            </div>
          </div>

          {/* Historical Analysis (Embedded) */}
          <div className="flex-1 min-h-[400px]">
            <HistoricalAnalysis simple />
          </div>

        </div>
      </div>
    </div>
  );
};

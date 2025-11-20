import React from 'react';
import { usePortfolioContext } from '../context/PortfolioContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { HoldingsTable } from './HoldingsTable';
import { clsx } from 'clsx';
import { RefreshCw } from 'lucide-react';

const COLORS = ['#2962ff', '#e22a19', '#00b498', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'];

interface DashboardProps {
  onNewTrade?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNewTrade }) => {
  const { stats, holdings, refreshPrices, apiKey } = usePortfolioContext();
  const [allocationType, setAllocationType] = React.useState<'symbol' | 'broker'>('symbol');
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshPrices();
    setIsRefreshing(false);
  };

  const allocationData = React.useMemo(() => {
    if (allocationType === 'symbol') {
      return holdings.map(h => ({
        name: h.symbol,
        value: h.shares * (h.currentPrice || h.avgCost),
      })).sort((a, b) => b.value - a.value);
    } else {
      const brokerMap = new Map<string, number>();
      holdings.forEach(h => {
        const value = h.shares * (h.currentPrice || h.avgCost);
        brokerMap.set(h.broker, (brokerMap.get(h.broker) || 0) + value);
      });
      return Array.from(brokerMap.entries()).map(([name, value]) => ({
        name,
        value
      })).sort((a, b) => b.value - a.value);
    }
  }, [holdings, allocationType]);

  const SummaryItem = ({ label, value, subValue, color = '#d1d4dc' }: any) => (
    <div className="flex flex-col">
      <span className="text-[#787b86] text-xs font-medium uppercase tracking-wide mb-1">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold font-mono tracking-tight" style={{ color }}>{value}</span>
        {subValue && <span className="text-sm font-medium">{subValue}</span>}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Summary Strip */}
      <div className="bg-[#1e222d] border border-[#2a2e39] p-6 rounded flex items-center justify-between shadow-sm">
        <div className="flex gap-12">
          <SummaryItem
            label="Total Assets"
            value={`$${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            color="#d1d4dc"
          />
          <SummaryItem
            label="Day Change"
            value="+$577.95"
            subValue="(+1.80%)"
            color="#00b498"
          />
          <SummaryItem
            label="Total P/L"
            value={`$${Math.abs(stats.totalUnrealizedPL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subValue={`(${((Math.abs(stats.totalUnrealizedPL) / (stats.totalCost || 1)) * 100).toFixed(2)}%)`}
            color={stats.totalUnrealizedPL >= 0 ? '#00b498' : '#e22a19'}
          />
        </div>
        <div className="flex gap-2">
          {apiKey && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-3 py-1.5 bg-[#2a2e39] hover:bg-[#363a45] text-[#d1d4dc] text-sm font-medium rounded transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={clsx("w-4 h-4", isRefreshing && "animate-spin")} />
              {isRefreshing ? 'Updating...' : 'Refresh Prices'}
            </button>
          )}
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
              <HoldingsTable />
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
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {allocationData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#131722', borderColor: '#2a2e39', borderRadius: '4px', color: '#d1d4dc' }}
                      itemStyle={{ color: '#d1d4dc' }}
                      formatter={(value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    />
                    <Legend
                      verticalAlign="bottom"
                      align="center"
                      iconType="circle"
                      wrapperStyle={{ color: '#d1d4dc', fontSize: '12px', paddingTop: '20px' }}
                    />
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                      <tspan x="50%" dy="-1em" fontSize="12" fill="#787b86">Total Assets</tspan>
                      <tspan x="50%" dy="1.5em" fontSize="18" fontWeight="bold" fill="#d1d4dc">
                        ${stats.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
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
        </div>
      </div>
    </div>
  );
};

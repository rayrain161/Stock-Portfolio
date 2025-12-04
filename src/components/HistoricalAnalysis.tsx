import { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { api } from '../services/api';
import { Upload, Loader2 } from 'lucide-react';
import { HistoryImporter } from './HistoryImporter';

interface HistoryData {
  date: string;
  twMarketValue: number;
  twCost: number;
  twPLRate: number;
  usMarketValueUSD: number;
  usCostUSD: number;
  usPLRate: number;
  totalMarketValue: number;
  totalCost: number;
  totalPLRate: number;
}

export const HistoricalAnalysis: React.FC<{ simple?: boolean }> = ({ simple }) => {
  const [data, setData] = useState<HistoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImporter, setShowImporter] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const history = await api.getHistory();
        // Ensure all numeric fields are actually numbers
        const parsedHistory = history.map(item => ({
          ...item,
          twMarketValue: Number(item.twMarketValue) || 0,
          twCost: Number(item.twCost) || 0,
          twPLRate: Number(item.twPLRate) || 0,
          usMarketValueUSD: Number(item.usMarketValueUSD) || 0,
          usCostUSD: Number(item.usCostUSD) || 0,
          usPLRate: Number(item.usPLRate) || 0,
          totalMarketValue: Number(item.totalMarketValue) || 0,
          totalCost: Number(item.totalCost) || 0,
          totalPLRate: Number(item.totalPLRate) || 0,
        }));
        setData(parsedHistory);
      } catch (error) {
        console.error('Failed to load history:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#2962ff]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {!simple && (
        <div className="flex justify-between items-center">
          <h3 className="text-[#d1d4dc] font-medium">Historical Analysis</h3>
          <button
            onClick={() => setShowImporter(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#2a2e39] hover:bg-[#363a45] text-[#d1d4dc] text-xs font-medium rounded transition-colors"
          >
            <Upload className="w-3 h-3" />
            Import CSV
          </button>
        </div>
      )}

      {showImporter && <HistoryImporter onClose={() => setShowImporter(false)} />}

      {data.length === 0 ? (
        <div className="text-center text-[#787b86] py-8">
          No historical data available. Import CSV or wait for daily updates.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Total Assets Chart */}
          <div className="bg-[#1e222d] p-4 rounded-xl shadow-sm border border-[#2a2e39]">
            <h3 className="text-sm font-semibold text-[#d1d4dc] mb-4">Total Assets: Market Value vs Cost (TWD)</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorTotalValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a2e39" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#787b86' }}
                    tickFormatter={(value) => {
                      const parts = value.split('/');
                      return parts.length > 2 ? parts[1] + '/' + parts[2] : value;
                    }}
                    axisLine={{ stroke: '#2a2e39' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#787b86' }}
                    tickFormatter={(value) => (value / 10000).toFixed(0) + 'w'}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e222d', borderColor: '#2a2e39', color: '#d1d4dc' }}
                    itemStyle={{ color: '#d1d4dc' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Area
                    type="monotone"
                    dataKey="totalMarketValue"
                    name="Total Market Value"
                    stroke="#8b5cf6"
                    fillOpacity={1}
                    fill="url(#colorTotalValue)"
                  />
                  <Area
                    type="monotone"
                    dataKey="totalCost"
                    name="Total Cost"
                    stroke="#9ca3af"
                    fill="none"
                    strokeDasharray="5 5"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Taiwan Stock Chart */}
            <div className="bg-[#1e222d] p-4 rounded-xl shadow-sm border border-[#2a2e39]">
              <h3 className="text-sm font-semibold text-[#d1d4dc] mb-4">Taiwan Stock (TWD)</h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="colorTwValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a2e39" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: '#787b86' }}
                      tickFormatter={(value) => {
                        const parts = value.split('/');
                        return parts.length > 2 ? parts[1] + '/' + parts[2] : value;
                      }}
                      axisLine={{ stroke: '#2a2e39' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#787b86' }}
                      tickFormatter={(value) => (value / 10000).toFixed(0) + 'w'}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e222d', borderColor: '#2a2e39', color: '#d1d4dc' }}
                      itemStyle={{ color: '#d1d4dc' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Area
                      type="monotone"
                      dataKey="twMarketValue"
                      name="Market Value"
                      stroke="#3b82f6"
                      fillOpacity={1}
                      fill="url(#colorTwValue)"
                    />
                    <Area
                      type="monotone"
                      dataKey="twCost"
                      name="Cost"
                      stroke="#9ca3af"
                      fill="none"
                      strokeDasharray="5 5"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* US Stock Chart */}
            <div className="bg-[#1e222d] p-4 rounded-xl shadow-sm border border-[#2a2e39]">
              <h3 className="text-sm font-semibold text-[#d1d4dc] mb-4">US Stock (USD)</h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="colorUsValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a2e39" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: '#787b86' }}
                      tickFormatter={(value) => {
                        const parts = value.split('/');
                        return parts.length > 2 ? parts[1] + '/' + parts[2] : value;
                      }}
                      axisLine={{ stroke: '#2a2e39' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#787b86' }}
                      tickFormatter={(value) => '$' + (value / 1000).toFixed(1) + 'k'}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e222d', borderColor: '#2a2e39', color: '#d1d4dc' }}
                      itemStyle={{ color: '#d1d4dc' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Area
                      type="monotone"
                      dataKey="usMarketValueUSD"
                      name="Market Value"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#colorUsValue)"
                    />
                    <Area
                      type="monotone"
                      dataKey="usCostUSD"
                      name="Cost"
                      stroke="#9ca3af"
                      fill="none"
                      strokeDasharray="5 5"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* P/L Rate Chart */}
          <div className="bg-[#1e222d] p-4 rounded-xl shadow-sm border border-[#2a2e39]">
            <h3 className="text-sm font-semibold text-[#d1d4dc] mb-4">Profit/Loss Rate (%)</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a2e39" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#787b86' }}
                    tickFormatter={(value) => {
                      const parts = value.split('/');
                      return parts.length > 2 ? parts[1] + '/' + parts[2] : value;
                    }}
                    axisLine={{ stroke: '#2a2e39' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#787b86' }}
                    tickFormatter={(value) => (value * 100).toFixed(0) + '%'}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e222d', borderColor: '#2a2e39', color: '#d1d4dc' }}
                    itemStyle={{ color: '#d1d4dc' }}
                    formatter={(value: number) => [(value * 100).toFixed(2) + '%', undefined]}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Line
                    type="monotone"
                    dataKey="twPLRate"
                    name="Taiwan"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="usPLRate"
                    name="US"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="totalPLRate"
                    name="Total"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

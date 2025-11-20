import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Loader2 } from 'lucide-react';

interface HistoryData {
  date: string;
  twMarketValue: number;
  twCost: number;
  twPLRate: number;
  usMarketValueUSD: number;
  usCostUSD: number;
  usPLRate: number;
  totalPLRate: number;
}

export function HistoricalAnalysis() {
  const [data, setData] = useState<HistoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/history');
        const jsonData = await response.json();
        setData(jsonData);
      } catch (error) {
        console.error('Failed to fetch history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#2962ff]" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center text-[#787b86] py-8">
        No historical data available.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Taiwan Stock Chart */}
      <div className="bg-[#1e222d] p-4 rounded-xl shadow-sm border border-[#2a2e39]">
        <h3 className="text-sm font-semibold text-[#d1d4dc] mb-4">Taiwan Stock: Market Value vs Cost (TWD)</h3>
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
                tickFormatter={(value) => value.split('/')[1] + '/' + value.split('/')[2]}
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
        <h3 className="text-sm font-semibold text-[#d1d4dc] mb-4">US Stock: Market Value vs Cost (USD)</h3>
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
                tickFormatter={(value) => value.split('/')[1] + '/' + value.split('/')[2]}
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
                tickFormatter={(value) => value.split('/')[1] + '/' + value.split('/')[2]}
                axisLine={{ stroke: '#2a2e39' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#787b86' }}
                tickFormatter={(value) => value + '%'}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e222d', borderColor: '#2a2e39', color: '#d1d4dc' }}
                itemStyle={{ color: '#d1d4dc' }}
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
  );
}

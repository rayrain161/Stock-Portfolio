import React from 'react';
import { usePortfolioContext } from '../context/PortfolioContext';

export const RealizedGains: React.FC = () => {
  const { realizedPositions } = usePortfolioContext();

  // Calculate summary stats
  const shortTermPositions = realizedPositions.filter(p => p.isShortTerm);
  const longTermPositions = realizedPositions.filter(p => !p.isShortTerm);

  const shortTermStats = shortTermPositions.reduce((acc, p) => ({
    salesProceeds: acc.salesProceeds + p.salesProceeds,
    adjustedCost: acc.adjustedCost + p.adjustedCost,
    netGain: acc.netGain + p.netGainLoss,
  }), { salesProceeds: 0, adjustedCost: 0, netGain: 0 });

  const longTermStats = longTermPositions.reduce((acc, p) => ({
    salesProceeds: acc.salesProceeds + p.salesProceeds,
    adjustedCost: acc.adjustedCost + p.adjustedCost,
    netGain: acc.netGain + p.netGainLoss,
  }), { salesProceeds: 0, adjustedCost: 0, netGain: 0 });

  const totalStats = {
    salesProceeds: shortTermStats.salesProceeds + longTermStats.salesProceeds,
    adjustedCost: shortTermStats.adjustedCost + longTermStats.adjustedCost,
    netGain: shortTermStats.netGain + longTermStats.netGain,
  };

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Summary Section */}
      <div className="bg-[#1e222d] border border-[#2a2e39] rounded p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[#d1d4dc] mb-4">Realized Gain/Loss Summary</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Short Term */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-[#787b86] uppercase tracking-wide">Short Term (&lt; 365 days)</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-[#787b86]">Sales Proceeds:</span>
                <span className="text-[#d1d4dc] font-mono">{formatCurrency(shortTermStats.salesProceeds)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#787b86]">Adjusted Cost:</span>
                <span className="text-[#d1d4dc] font-mono">{formatCurrency(shortTermStats.adjustedCost)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-[#2a2e39]">
                <span className="text-[#787b86] font-medium">Net Gain:</span>
                <span className={`font-mono font-semibold ${shortTermStats.netGain >= 0 ? 'text-[#00b498]' : 'text-[#e22a19]'}`}>
                  {formatCurrency(shortTermStats.netGain)} ({formatPercent((shortTermStats.netGain / (shortTermStats.adjustedCost || 1)) * 100)})
                </span>
              </div>
            </div>
          </div>

          {/* Long Term */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-[#787b86] uppercase tracking-wide">Long Term (≥ 365 days)</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-[#787b86]">Sales Proceeds:</span>
                <span className="text-[#d1d4dc] font-mono">{formatCurrency(longTermStats.salesProceeds)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#787b86]">Adjusted Cost:</span>
                <span className="text-[#d1d4dc] font-mono">{formatCurrency(longTermStats.adjustedCost)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-[#2a2e39]">
                <span className="text-[#787b86] font-medium">Net Gain:</span>
                <span className={`font-mono font-semibold ${longTermStats.netGain >= 0 ? 'text-[#00b498]' : 'text-[#e22a19]'}`}>
                  {formatCurrency(longTermStats.netGain)} ({formatPercent((longTermStats.netGain / (longTermStats.adjustedCost || 1)) * 100)})
                </span>
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="space-y-2 bg-[#131722] p-4 rounded">
            <h3 className="text-sm font-medium text-[#787b86] uppercase tracking-wide">Total Realized</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-[#787b86]">Sales Proceeds:</span>
                <span className="text-[#d1d4dc] font-mono">{formatCurrency(totalStats.salesProceeds)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#787b86]">Adjusted Cost:</span>
                <span className="text-[#d1d4dc] font-mono">{formatCurrency(totalStats.adjustedCost)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-[#2a2e39]">
                <span className="text-[#787b86] font-medium">Net Gain:</span>
                <span className={`font-mono font-semibold text-lg ${totalStats.netGain >= 0 ? 'text-[#00b498]' : 'text-[#e22a19]'}`}>
                  {formatCurrency(totalStats.netGain)} ({formatPercent((totalStats.netGain / (totalStats.adjustedCost || 1)) * 100)})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-[#1e222d] border border-[#2a2e39] rounded flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-[#2a2e39]">
          <h3 className="text-[#d1d4dc] font-medium">Closed Positions</h3>
        </div>
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#131722] sticky top-0 z-10">
              <tr className="text-[#787b86] uppercase tracking-wide text-[10px] font-medium">
                <th className="px-3 py-2 text-left">Symbol</th>
                <th className="px-3 py-2 text-left">Broker</th>
                <th className="px-3 py-2 text-right">Qty</th>
                <th className="px-3 py-2 text-right">Days Held</th>
                <th className="px-3 py-2 text-right">Acquired</th>
                <th className="px-3 py-2 text-right">Sold</th>
                <th className="px-3 py-2 text-right">Sales Proceeds</th>
                <th className="px-3 py-2 text-right">Adjusted Cost</th>
                <th className="px-3 py-2 text-right">Net Gain/Loss</th>
              </tr>
            </thead>
            <tbody className="text-[#d1d4dc] font-mono">
              {realizedPositions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-[#787b86]">
                    No realized gains/losses yet
                  </td>
                </tr>
              ) : (
                realizedPositions.map((position, index) => (
                  <tr key={index} className="border-b border-[#2a2e39] hover:bg-[#131722] transition-colors">
                    <td className="px-3 py-2 font-semibold">{position.symbol}</td>
                    <td className="px-3 py-2 text-[#787b86]">{position.broker}</td>
                    <td className="px-3 py-2 text-right">{position.quantity.toFixed(4)}</td>
                    <td className="px-3 py-2 text-right">
                      <span className={position.isShortTerm ? 'text-[#f59e0b]' : 'text-[#8b5cf6]'}>
                        {position.daysHeld}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-[#787b86]">{formatDate(position.dateAcquired)}</td>
                    <td className="px-3 py-2 text-right text-[#787b86]">{formatDate(position.dateSold)}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(position.salesProceeds)}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(position.adjustedCost)}</td>
                    <td className={`px-3 py-2 text-right font-semibold ${position.netGainLoss >= 0 ? 'text-[#00b498]' : 'text-[#e22a19]'}`}>
                      {formatCurrency(position.netGainLoss)}<br />
                      <span className="text-xs">({formatPercent(position.gainLossPercent)})</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

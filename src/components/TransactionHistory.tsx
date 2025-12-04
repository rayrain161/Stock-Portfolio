import React from 'react';
import { usePortfolioContext } from '../context/PortfolioContext';
import { Trash2, Upload } from 'lucide-react';
import { clsx } from 'clsx';
import { TransactionImporter } from './TransactionImporter';

export const TransactionHistory: React.FC = () => {
  const { transactions, deleteTransaction, refreshPrices } = usePortfolioContext();
  const [showImporter, setShowImporter] = React.useState(false);

  const handleImportSuccess = () => {
    refreshPrices(); // Refresh data after import
  };

  if (transactions.length === 0 && !showImporter) {
    return (
      <div className="text-center py-20 bg-[#1e222d] rounded border border-[#2a2e39] border-dashed">
        <p className="text-[#787b86] mb-4">No transactions recorded yet.</p>
        <button
          onClick={() => setShowImporter(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#2962ff] hover:bg-[#1e53e5] text-white font-medium rounded transition-colors"
        >
          <Upload className="w-4 h-4" />
          Import Transactions
        </button>
        {showImporter && <TransactionImporter onClose={() => setShowImporter(false)} onImportSuccess={handleImportSuccess} />}
      </div>
    );
  }

  // Sort by date descending, handling invalid dates safely
  const sortedTransactions = React.useMemo(() => {
    return [...transactions].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
    });
  }, [transactions]);

  try {
    return (
      <div className="bg-[#1e222d] border border-[#2a2e39] rounded overflow-hidden flex flex-col">
        <div className="p-4 border-b border-[#2a2e39] flex justify-between items-center">
          <h3 className="text-[#d1d4dc] font-medium">Transaction History</h3>
          <button
            onClick={() => setShowImporter(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#2a2e39] hover:bg-[#363a45] text-[#d1d4dc] text-xs font-medium rounded transition-colors"
          >
            <Upload className="w-3 h-3" />
            Import CSV
          </button>
        </div>
        {showImporter && <TransactionImporter onClose={() => setShowImporter(false)} onImportSuccess={handleImportSuccess} />}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#2a2e39] text-[#787b86]">
                <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider">Symbol</th>
                <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider">Broker</th>
                <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider text-right">Shares</th>
                <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider text-right">Price</th>
                <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider text-right">Total</th>
                <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2e39]">
              {sortedTransactions.map((t) => {
                const total = t.total ?? ((t.shares || 0) * (t.price || 0) + (t.fee || 0));
                const isBuy = t.type === 'Buy';

                const dateStr = new Date(t.date).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');

                return (
                  <tr key={t.id} className="hover:bg-[#2a2e39] transition-colors group">
                    <td className="px-4 py-3 text-[#d1d4dc] font-mono">{dateStr}</td>
                    <td className="px-4 py-3">
                      <span className={clsx(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide",
                        isBuy ? "text-[#00b498] bg-[#00b498]/10" : "text-[#e22a19] bg-[#e22a19]/10"
                      )}>
                        {t.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#d1d4dc]">{t.symbol}</td>
                    <td className="px-4 py-3 text-[#787b86]">{t.broker}</td>
                    <td className="px-4 py-3 text-right text-[#d1d4dc] font-mono">{(t.shares || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-[#d1d4dc] font-mono">${(t.price || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-medium text-[#d1d4dc] font-mono">${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deleteTransaction(t.id)}
                        className="p-1.5 text-[#787b86] hover:text-[#e22a19] hover:bg-[#e22a19]/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete Transaction"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  } catch (e) {
    console.error('Error rendering TransactionHistory:', e);
    return <div className="text-red-500 p-4">Error loading transaction history.</div>;
  }
};

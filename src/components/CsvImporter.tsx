import React, { useState } from 'react';
import { usePortfolioContext } from '../context/PortfolioContext';
import type { Transaction, Broker } from '../types';
import { AlertCircle, Check, X, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';

export const CsvImporter: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { addTransactions } = usePortfolioContext();
  const [csvContent, setCsvContent] = useState('');
  const [parsedTransactions, setParsedTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'input' | 'preview'>('input');

  const parseDate = (dateStr: string): string => {
    try {
      // Format: 2025/1/24 am 2:21:23
      const [datePart] = dateStr.split(' ');
      const [year, month, day] = datePart.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    } catch (e) {
      console.error('Date parsing error:', dateStr, e);
      return new Date().toISOString().split('T')[0];
    }
  };

  const parseCsv = () => {
    setError(null);
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      setError('CSV must have a header and at least one data row.');
      return;
    }

    const header = lines[0].trim();
    const isTw = header.includes('手續費') && !header.includes('卷商');
    const isUs = header.includes('卷商') || header.includes('成本(USD)');

    if (!isTw && !isUs) {
      setError('Unknown CSV format. Please check the header.');
      return;
    }

    const transactions: Transaction[] = [];

    try {
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = line.split(',').map(c => c.trim());

        if (isTw) {
          // TW Format: 時間,買賣別,股票代號,數量,成交價格,市值,手續費,成本
          // Index:      0    1      2        3     4        5    6      7
          const [dateStr, typeStr, symbol, sharesStr, priceStr, , feeStr] = cols;

          transactions.push({
            id: crypto.randomUUID(),
            date: parseDate(dateStr),
            broker: 'FubonTW',
            symbol: symbol.toUpperCase(),
            type: typeStr === '買進' ? 'Buy' : 'Sell',
            shares: parseFloat(sharesStr),
            price: parseFloat(priceStr),
            fee: parseFloat(feeStr) || 0,
            notes: 'Imported via CSV',
            currency: 'TWD',
          });
        } else {
          // US Format: 時間,買賣別,卷商,股票代號,數量,成交價格,市值,台幣交割,成本(USD),成本(TWD),
          // Index:      0    1      2    3        4     5        6    7        8          9
          const [dateStr, typeStr, brokerStr, symbol, sharesStr, priceStr] = cols;

          let broker: Broker = 'Firstrade';
          if (brokerStr.toLowerCase().includes('富邦')) broker = 'FubonSub';
          if (brokerStr.toLowerCase().includes('firstrade')) broker = 'Firstrade';

          transactions.push({
            id: crypto.randomUUID(),
            date: parseDate(dateStr),
            broker: broker,
            symbol: symbol.toUpperCase(),
            type: typeStr === '買進' ? 'Buy' : 'Sell',
            shares: parseFloat(sharesStr),
            price: parseFloat(priceStr),
            fee: 0, // User requested 0 fee for US
            notes: 'Imported via CSV',
            currency: 'USD',
          });
        }
      }

      setParsedTransactions(transactions);
      setStep('preview');
    } catch (e) {
      console.error(e);
      setError('Failed to parse CSV. Please check the format.');
    }
  };

  const handleImport = async () => {
    await addTransactions(parsedTransactions);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e222d] border border-[#2a2e39] rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-[#2a2e39]">
          <h3 className="text-lg font-semibold text-[#d1d4dc]">Import Transactions</h3>
          <button onClick={onClose} className="text-[#787b86] hover:text-[#d1d4dc]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-auto">
          {step === 'input' ? (
            <div className="space-y-4">
              <div className="bg-[#2a2e39]/30 p-4 rounded border border-[#2a2e39]">
                <h4 className="text-sm font-medium text-[#d1d4dc] mb-2">Supported Formats</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#787b86]">
                  <div>
                    <strong className="text-[#00b498]">Taiwan Stock (台股)</strong>
                    <pre className="mt-1 p-2 bg-[#131722] rounded overflow-x-auto">
                      時間,買賣別,股票代號,數量,成交價格,市值,手續費,成本
                    </pre>
                  </div>
                  <div>
                    <strong className="text-[#2962ff]">US Stock (美股)</strong>
                    <pre className="mt-1 p-2 bg-[#131722] rounded overflow-x-auto">
                      時間,買賣別,卷商,股票代號,數量,成交價格,市值...
                    </pre>
                  </div>
                </div>
              </div>

              <textarea
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                placeholder="Paste your CSV content here..."
                className="w-full h-64 bg-[#131722] border border-[#2a2e39] rounded p-4 text-[#d1d4dc] font-mono text-sm focus:outline-none focus:border-[#2962ff]"
              />

              {error && (
                <div className="flex items-center gap-2 text-[#e22a19] text-sm bg-[#e22a19]/10 p-3 rounded">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[#d1d4dc] text-sm">
                  Found <strong className="text-white">{parsedTransactions.length}</strong> transactions
                </span>
                <button
                  onClick={() => setStep('input')}
                  className="text-[#2962ff] text-sm hover:underline"
                >
                  Edit CSV
                </button>
              </div>

              <div className="border border-[#2a2e39] rounded overflow-hidden">
                <table className="w-full text-sm text-left text-[#d1d4dc]">
                  <thead className="bg-[#2a2e39] text-[#787b86] font-medium">
                    <tr>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Broker</th>
                      <th className="px-4 py-2">Type</th>
                      <th className="px-4 py-2">Symbol</th>
                      <th className="px-4 py-2 text-right">Shares</th>
                      <th className="px-4 py-2 text-right">Price</th>
                      <th className="px-4 py-2 text-right">Fee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2e39]">
                    {parsedTransactions.map((t, i) => (
                      <tr key={i} className="hover:bg-[#2a2e39]/50">
                        <td className="px-4 py-2">{t.date}</td>
                        <td className="px-4 py-2">{t.broker}</td>
                        <td className={clsx(
                          "px-4 py-2 font-medium",
                          t.type === 'Buy' ? 'text-[#00b498]' : 'text-[#e22a19]'
                        )}>
                          {t.type}
                        </td>
                        <td className="px-4 py-2 font-mono">{t.symbol}</td>
                        <td className="px-4 py-2 text-right font-mono">{t.shares}</td>
                        <td className="px-4 py-2 text-right font-mono">{t.price}</td>
                        <td className="px-4 py-2 text-right font-mono">{t.fee}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[#2a2e39] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[#d1d4dc] hover:bg-[#2a2e39] rounded transition-colors text-sm"
          >
            Cancel
          </button>
          {step === 'input' ? (
            <button
              onClick={parseCsv}
              disabled={!csvContent.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-[#2962ff] hover:bg-[#1e53dc] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded font-medium transition-colors text-sm"
            >
              Preview <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleImport}
              className="flex items-center gap-2 px-4 py-2 bg-[#00b498] hover:bg-[#009688] text-white rounded font-medium transition-colors text-sm"
            >
              <Check className="w-4 h-4" />
              Import {parsedTransactions.length} Transactions
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

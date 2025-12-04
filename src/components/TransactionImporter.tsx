import React, { useState } from 'react';
import { X, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import type { Transaction, Broker } from '../types';
import { clsx } from 'clsx';

interface TransactionImporterProps {
  onClose: () => void;
  onImportSuccess?: () => void;
}

export const TransactionImporter: React.FC<TransactionImporterProps> = ({ onClose, onImportSuccess }) => {
  const [csvContent, setCsvContent] = useState('');
  const [parsedData, setParsedData] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedBroker, setSelectedBroker] = useState<Broker>('FubonTW');

  const parseCSV = () => {
    setError(null);
    setSuccessMsg(null);
    setParsedData([]);

    if (!csvContent.trim()) {
      setError('Please paste CSV content first.');
      return;
    }

    try {
      const lines = csvContent.trim().split('\n');
      const transactions: Transaction[] = [];
      let skipped = 0;

      // Skip header if present (starts with "成交日期")
      const startIdx = lines[0].includes('成交日期') ? 1 : 0;

      for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Handle CSV parsing with quotes (e.g. "1,000")
        // Robust character-by-character parsing
        const parts: string[] = [];
        let current = '';
        let inQuote = false;

        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            inQuote = !inQuote;
          } else if (char === ',' && !inQuote) {
            parts.push(current);
            current = '';
          } else {
            current += char;
          }
        }
        parts.push(current); // Push the last part

        if (parts.length < 6) {
          console.warn('Skipping invalid line:', line);
          skipped++;
          continue;
        }

        // Clean quotes from parts
        const cleanParts = parts.map(p => {
          p = p.trim();
          if (p.startsWith('"') && p.endsWith('"')) {
            p = p.slice(1, -1);
          }
          return p.trim();
        });

        // Columns based on user input:
        // 0: Date (2025/1/6)
        // 1: Type (定期定額, 現股買進, 現股賣出)
        // 2: Symbol (富邦台50(006208))
        // 3: Shares (17)
        // 4: Price (116.59)
        // 5: Total/Gross ("1,982") - NOT USED directly for Net
        // 6: Fee (1)
        // 7: Tax (0)
        // ...
        // 15: Net Amount ("-1,983") - We map abs(this) to total
        // 16: Currency (新台幣)

        const dateStr = cleanParts[0];
        const typeStr = cleanParts[1];
        const symbolStr = cleanParts[2];
        const sharesStr = cleanParts[3].replace(/,/g, '');
        const priceStr = cleanParts[4].replace(/,/g, '');
        const feeStr = cleanParts[6]?.replace(/,/g, '') || '0';
        const taxStr = cleanParts[7]?.replace(/,/g, '') || '0';
        const netStr = cleanParts[15]?.replace(/,/g, '') || '0'; // Net Amount

        console.log('Parsing line:', { line, typeStr, symbolStr });

        // Parse Type
        let type: 'Buy' | 'Sell' | null = null;
        if (typeStr.includes('買') || typeStr.includes('定期')) type = 'Buy';
        else if (typeStr.includes('賣')) type = 'Sell';

        if (!type) {
          console.warn('Unknown type:', typeStr);
          skipped++;
          continue;
        }

        // Parse Symbol: Extract 006208 from "富邦台50(006208)" or "富邦台50（006208）"
        // Handle both half-width and full-width parentheses
        const symbolMatch = symbolStr.match(/[(\uff08](\d+)[)\uff09]/);
        const symbol = symbolMatch ? symbolMatch[1] : symbolStr;

        // Parse Numbers
        const shares = parseFloat(sharesStr);
        const price = parseFloat(priceStr);
        const fee = parseFloat(feeStr);
        const tax = parseFloat(taxStr);
        const net = Math.abs(parseFloat(netStr));

        if (isNaN(shares) || isNaN(price)) {
          console.warn('Invalid numbers:', { sharesStr, priceStr });
          skipped++;
          continue;
        }

        const txn: Transaction = {
          id: crypto.randomUUID(),
          date: dateStr, // Keep format YYYY/M/D or convert? App uses YYYY-MM-DD usually but string is fine
          type,
          symbol,
          shares,
          price,
          fee,
          tax,
          total: net, // Map Net Amount (abs) to total
          notes: typeStr, // Store original type as note
          broker: selectedBroker,
          currency: 'TWD' // Default to TWD as per request
        };

        transactions.push(txn);
      }

      if (transactions.length === 0) {
        setError('No valid transactions found. Please check the format.');
      } else {
        setParsedData(transactions);
        if (skipped > 0) {
          setSuccessMsg(`Parsed ${transactions.length} transactions. (Skipped ${skipped} invalid lines)`);
        }
      }

    } catch (e) {
      console.error(e);
      setError('Failed to parse CSV. Please check the format.');
    }
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;

    setImporting(true);
    setError(null);
    try {
      await api.importTransactions(parsedData);
      setSuccessMsg(`Successfully imported ${parsedData.length} transactions!`);
      setTimeout(() => {
        if (onImportSuccess) onImportSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to import transactions');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e222d] rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-[#2a2e39]">
        <div className="flex justify-between items-center p-6 border-b border-[#2a2e39]">
          <h2 className="text-xl font-bold text-[#d1d4dc]">Import Transactions (TW Stock)</h2>
          <button onClick={onClose} className="text-[#787b86] hover:text-[#d1d4dc]">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-auto">
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {successMsg && !error && (
            <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2 text-green-400">
              <CheckCircle className="w-5 h-5" />
              {successMsg}
            </div>
          )}

          {!parsedData.length ? (
            <div className="space-y-4">
              <div>
                <label className="block text-[#787b86] text-sm font-medium mb-2">Select Broker</label>
                <select
                  value={selectedBroker}
                  onChange={(e) => setSelectedBroker(e.target.value as Broker)}
                  className="bg-[#2a2e39] border border-[#363a45] rounded px-3 py-2 text-[#d1d4dc] focus:outline-none focus:border-[#2962ff]"
                >
                  <option value="FubonTW">Fubon TW (富邦)</option>
                  <option value="SinoPac">SinoPac (永豐)</option>
                  <option value="FubonSub">Fubon Sub (複委託)</option>
                  <option value="Firstrade">Firstrade</option>
                </select>
              </div>

              <div>
                <label className="block text-[#787b86] text-sm font-medium mb-2">
                  Paste CSV Content
                  <span className="ml-2 text-xs opacity-70">(Columns: Date, Type, Symbol, Shares, Price, Gross, Fee, Tax, ..., Net, Currency)</span>
                </label>
                <textarea
                  value={csvContent}
                  onChange={(e) => setCsvContent(e.target.value)}
                  className="w-full h-64 bg-[#131722] border border-[#2a2e39] rounded-lg p-4 text-[#d1d4dc] font-mono text-xs focus:outline-none focus:border-[#2962ff]"
                  placeholder={`2025/1/6,定期定額,富邦台50(006208),17,116.59,"1,982",1,0,0,0,0,0,0,0,0,"-1,983",新台幣...`}
                />
              </div>
              <button
                onClick={parseCSV}
                className="w-full py-2 bg-[#2962ff] hover:bg-[#1e53e5] text-white rounded-lg font-medium transition-colors"
              >
                Preview Data
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-[#d1d4dc] font-medium">Preview ({parsedData.length} items)</h3>
                <button
                  onClick={() => setParsedData([])}
                  className="text-[#2962ff] text-sm hover:underline"
                >
                  Clear & Edit
                </button>
              </div>

              <div className="overflow-x-auto border border-[#2a2e39] rounded-lg">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#2a2e39] text-[#787b86] text-xs uppercase">
                      <th className="p-3">Date</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Symbol</th>
                      <th className="p-3 text-right">Shares</th>
                      <th className="p-3 text-right">Price</th>
                      <th className="p-3 text-right">Fee</th>
                      <th className="p-3 text-right">Tax</th>
                      <th className="p-3 text-right">Net Total</th>
                      <th className="p-3">Broker</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2e39]">
                    {parsedData.map((txn, i) => (
                      <tr key={i} className="text-[#d1d4dc] text-sm hover:bg-[#2a2e39]/50">
                        <td className="p-3 whitespace-nowrap">{txn.date}</td>
                        <td className="p-3">
                          <span className={clsx(
                            "px-1.5 py-0.5 rounded text-xs font-medium",
                            txn.type === 'Buy' ? "bg-[#00b498]/20 text-[#00b498]" : "bg-[#e22a19]/20 text-[#e22a19]"
                          )}>
                            {txn.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 font-mono">{txn.symbol}</td>
                        <td className="p-3 text-right font-mono">{txn.shares}</td>
                        <td className="p-3 text-right font-mono">{txn.price}</td>
                        <td className="p-3 text-right font-mono text-[#787b86]">{txn.fee}</td>
                        <td className="p-3 text-right font-mono text-[#787b86]">{txn.tax}</td>
                        <td className="p-3 text-right font-mono font-medium">{(txn.total ?? 0).toLocaleString()}</td>
                        <td className="p-3 text-[#787b86] text-xs">{txn.broker}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setParsedData([])}
                  className="flex-1 py-2 bg-[#2a2e39] hover:bg-[#363a45] text-[#d1d4dc] rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="flex-1 py-2 bg-[#2962ff] hover:bg-[#1e53e5] text-white rounded-lg font-medium transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  {importing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Import {parsedData.length} Transactions
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

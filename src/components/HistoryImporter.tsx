import React, { useState } from 'react';
import { api } from '../services/api';
import { AlertCircle, X, ArrowRight } from 'lucide-react';

export const HistoryImporter: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [csvContent, setCsvContent] = useState('');
  const [parsedItems, setParsedItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'input' | 'preview'>('input');
  const [isImporting, setIsImporting] = useState(false);

  const parseCsv = () => {
    setError(null);
    const lines = csvContent.trim().split('\n');
    if (lines.length < 1) {
      setError('Please paste some data.');
      return;
    }

    const items: any[] = [];

    try {
      lines.forEach((line) => {
        if (!line.trim()) return;
        // Split by comma
        const cols = line.split(',').map(c => c.trim());

        // Skip header row if detected (starts with Date or non-digit)
        // The user's data starts with 2025/..., so checking for digit is good.
        // Also check if it contains "Date" or "日期"
        if (cols[0].includes('Date') || cols[0].includes('日期') || !/^\d/.test(cols[0])) {
          return;
        }

        // Expected format:
        // 0: Date, 1: TW_MV, 2: TW_Cost, 3: TW_PL, 4: TW_PL%
        // 5: US_TWD_MV, 6: US_TWD_Cost, 7: US_TWD_PL, 8: US_TWD_PL%
        // 9: US_USD_MV, 10: US_USD_Cost, 11: US_USD_PL, 12: US_USD_PL%
        // 13: Total_MV, 14: Total_Cost, 15: Total_PL, 16: Total_PL%

        // User's CSV might have empty trailing columns, so we check if we have enough data columns.
        // We need at least 17 columns of data.
        if (cols.length < 17) {
          return;
        }

        const parseVal = (val: string) => {
          if (!val) return 0;
          const num = parseFloat(val.replace('%', ''));
          return isNaN(num) ? 0 : num;
        };

        items.push({
          date: cols[0],
          twMarketValue: parseVal(cols[1]),
          twCost: parseVal(cols[2]),
          twPL: parseVal(cols[3]),
          twPLRate: parseVal(cols[4]),

          usTwdMarketValue: parseVal(cols[5]),
          usTwdCost: parseVal(cols[6]),
          usTwdPL: parseVal(cols[7]),
          usTwdPLRate: parseVal(cols[8]),

          usUsdMarketValue: parseVal(cols[9]),
          usUsdCost: parseVal(cols[10]),
          usUsdPL: parseVal(cols[11]),
          usUsdPLRate: parseVal(cols[12]),

          totalMarketValue: parseVal(cols[13]),
          totalCost: parseVal(cols[14]),
          totalPL: parseVal(cols[15]),
          totalPLRate: parseVal(cols[16]),
        });
      });

      if (items.length === 0) {
        setError('No valid rows found. Please check your CSV format.');
        return;
      }

      setParsedItems(items);
      setStep('preview');
    } catch (e) {
      console.error(e);
      setError('Failed to parse CSV.');
    }
  };

  const [overwrite, setOverwrite] = useState(true);

  const handleImport = async () => {
    setIsImporting(true);
    try {
      await api.importHistory(parsedItems, overwrite);
      alert('Import successful!');
      onClose();
      window.location.reload();
    } catch (e) {
      console.error(e);
      setError('Failed to upload to GAS.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-[#1e222d] border border-[#2a2e39] rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-[#2a2e39]">
          <h3 className="text-lg font-semibold text-[#d1d4dc]">Import Historical Data</h3>
          <button onClick={onClose} className="text-[#787b86] hover:text-[#d1d4dc]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-auto">
          {step === 'input' ? (
            <div className="space-y-4">
              <div className="bg-[#2a2e39]/30 p-4 rounded border border-[#2a2e39]">
                <h4 className="text-sm font-medium text-[#d1d4dc] mb-2">Format</h4>
                <div className="text-xs text-[#787b86] font-mono overflow-x-auto whitespace-nowrap">
                  Date, TW_MV, TW_Cost, TW_PL, TW_PL%, US_TWD_MV, US_TWD_Cost, US_TWD_PL, US_TWD_PL%, US_USD_MV, US_USD_Cost, US_USD_PL, US_USD_PL%, Total_MV, Total_Cost, Total_PL, Total_PL%
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
                <div className="flex items-center gap-4">
                  <span className="text-[#d1d4dc] text-sm">
                    Found <strong className="text-white">{parsedItems.length}</strong> records
                  </span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={overwrite}
                      onChange={(e) => setOverwrite(e.target.checked)}
                      className="w-4 h-4 rounded border-[#2a2e39] bg-[#131722] text-[#2962ff] focus:ring-0 focus:ring-offset-0"
                    />
                    <span className="text-[#d1d4dc] text-sm">Overwrite existing data</span>
                  </label>
                </div>
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
                      <th className="px-4 py-2 text-right">Total MV</th>
                      <th className="px-4 py-2 text-right">Total Cost</th>
                      <th className="px-4 py-2 text-right">Total P/L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2e39]">
                    {parsedItems.slice(0, 10).map((item, i) => (
                      <tr key={i} className="hover:bg-[#2a2e39]/50">
                        <td className="px-4 py-2">{item.date}</td>
                        <td className="px-4 py-2 text-right">{item.totalMarketValue}</td>
                        <td className="px-4 py-2 text-right">{item.totalCost}</td>
                        <td className="px-4 py-2 text-right">{item.totalPL}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedItems.length > 10 && (
                  <div className="p-2 text-center text-xs text-[#787b86] bg-[#2a2e39]/30">
                    ...and {parsedItems.length - 10} more rows
                  </div>
                )}
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
              disabled={isImporting}
              className="flex items-center gap-2 px-4 py-2 bg-[#00b498] hover:bg-[#009688] text-white rounded font-medium transition-colors text-sm disabled:opacity-50"
            >
              {isImporting ? 'Importing...' : `Import ${parsedItems.length} Records`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

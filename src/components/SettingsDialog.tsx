import React, { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import { usePortfolioContext } from '../context/PortfolioContext';
import { setGasUrl } from '../services/api';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: string) => void;
  initialApiKey: string;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ isOpen, onClose, onSave, initialApiKey }) => {
  const { clearAllTransactions } = usePortfolioContext();
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [gasUrl, setGasUrlInput] = useState('');

  useEffect(() => {
    setApiKey(initialApiKey);
    const savedGasUrl = localStorage.getItem('stock_position_gas_url');
    if (savedGasUrl) {
      setGasUrlInput(savedGasUrl);
    }
  }, [initialApiKey, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-[#1e222d] border border-[#2a2e39] rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[#2a2e39]">
          <h2 className="text-[#d1d4dc] font-medium">Settings</h2>
          <button onClick={onClose} className="text-[#787b86] hover:text-[#d1d4dc]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* GAS URL Section */}
          <div>
            <label className="block text-xs font-medium text-[#787b86] uppercase tracking-wide mb-2">
              Google Apps Script URL
            </label>
            <input
              type="text"
              value={gasUrl}
              onChange={(e) => setGasUrlInput(e.target.value)}
              placeholder="https://script.google.com/macros/s/..."
              className="w-full bg-[#131722] border border-[#2a2e39] rounded px-3 py-2 text-[#d1d4dc] text-sm focus:outline-none focus:border-[#2962ff] transition-colors placeholder-[#787b86]/50"
            />
            <p className="text-[10px] text-[#787b86] mt-2">
              The Web App URL from your Google Apps Script deployment.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#787b86] uppercase tracking-wide mb-2">
              Finnhub API Key
            </label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
              className="w-full bg-[#131722] border border-[#2a2e39] rounded px-3 py-2 text-[#d1d4dc] text-sm focus:outline-none focus:border-[#2962ff] transition-colors placeholder-[#787b86]/50"
            />
            <p className="text-[10px] text-[#787b86] mt-2">
              Get a free API key from <a href="https://finnhub.io/" target="_blank" rel="noreferrer" className="text-[#2962ff] hover:underline">finnhub.io</a> to enable real-time price updates.
            </p>
          </div>

          <div className="pt-4 border-t border-[#2a2e39]">
            <h3 className="text-xs font-medium text-[#e22a19] uppercase tracking-wide mb-2">Danger Zone</h3>
            <p className="text-[10px] text-[#787b86] mb-3">
              This action cannot be undone. This will permanently delete all your transaction history.
            </p>
            <button
              onClick={async () => {
                if (window.confirm('Are you sure you want to delete ALL transaction history? This cannot be undone.')) {
                  await clearAllTransactions();
                  onClose();
                }
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#e22a19]/10 hover:bg-[#e22a19]/20 text-[#e22a19] border border-[#e22a19]/50 rounded text-sm font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear All Data
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-[#2a2e39] flex justify-end bg-[#1e222d]">
          <button
            onClick={() => {
              onSave(apiKey);
              if (gasUrl) {
                setGasUrl(gasUrl);
              }
              onClose();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#2962ff] hover:bg-[#1e53dc] text-white rounded text-sm font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

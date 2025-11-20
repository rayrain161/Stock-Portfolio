import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: string) => void;
  initialApiKey: string;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ isOpen, onClose, onSave, initialApiKey }) => {
  const [apiKey, setApiKey] = useState(initialApiKey);

  useEffect(() => {
    setApiKey(initialApiKey);
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

        <div className="p-6 space-y-4">
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
        </div>

        <div className="p-4 border-t border-[#2a2e39] flex justify-end bg-[#1e222d]">
          <button
            onClick={() => {
              onSave(apiKey);
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

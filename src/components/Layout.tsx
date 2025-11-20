import React, { useState } from 'react';
import { LayoutDashboard, PieChart, ArrowLeftRight, TrendingUp, Settings } from 'lucide-react';
import { clsx } from 'clsx';
import { usePortfolioContext } from '../context/PortfolioContext';
import { SettingsDialog } from './SettingsDialog';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'holdings' | 'history' | 'realized';
  onTabChange: (tab: 'dashboard' | 'holdings' | 'history' | 'realized') => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { apiKey, setApiKey } = usePortfolioContext();

  return (
    <div className="min-h-screen bg-[#131722] text-[#d1d4dc] font-sans selection:bg-[#2962ff] selection:text-white">
      {/* Header */}
      <header className="h-14 border-b border-[#2a2e39] bg-[#1e222d] flex items-center justify-between px-4 sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#2962ff] rounded flex items-center justify-center text-white font-bold text-lg">
              SF
            </div>
            <span className="font-bold text-lg tracking-tight text-[#d1d4dc]">StockFolio</span>
          </div>

          <nav className="flex items-center gap-1">
            <button
              onClick={() => onTabChange('dashboard')}
              className={clsx(
                "flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors",
                activeTab === 'dashboard'
                  ? "text-[#d1d4dc] bg-[#2a2e39]"
                  : "text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]/50"
              )}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={() => onTabChange('holdings')}
              className={clsx(
                "flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors",
                activeTab === 'holdings'
                  ? "text-[#d1d4dc] bg-[#2a2e39]"
                  : "text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]/50"
              )}
            >
              <PieChart className="w-4 h-4" />
              Holdings
            </button>
            <button
              onClick={() => onTabChange('history')}
              className={clsx(
                "flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors",
                activeTab === 'history'
                  ? "text-[#d1d4dc] bg-[#2a2e39]"
                  : "text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]/50"
              )}
            >
              <ArrowLeftRight className="w-4 h-4" />
              History
            </button>
            <button
              onClick={() => onTabChange('realized')}
              className={clsx(
                "flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors",
                activeTab === 'realized'
                  ? "text-[#d1d4dc] bg-[#2a2e39]"
                  : "text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]/50"
              )}
            >
              <TrendingUp className="w-4 h-4" />
              Realized
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-[#2a2e39]/50 rounded border border-[#2a2e39]">
            <div className="w-2 h-2 rounded-full bg-[#00b498] animate-pulse"></div>
            <span className="text-xs font-medium text-[#00b498]">Market Open</span>
          </div>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39] rounded transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#2962ff] to-[#2962ff]/50 border border-[#2a2e39]"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 max-w-[1800px] mx-auto h-[calc(100vh-3.5rem)] overflow-hidden">
        {children}
      </main>

      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={setApiKey}
        initialApiKey={apiKey}
      />
    </div>
  );
};

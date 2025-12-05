import React, { useState } from 'react';
import { LayoutDashboard, PieChart, ArrowLeftRight, TrendingUp, Settings } from 'lucide-react';
import { clsx } from 'clsx';
import { usePortfolioContext } from '../context/PortfolioContext';
import { SettingsDialog } from './SettingsDialog';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'holdings' | 'history' | 'analysis' | 'realized';
  onTabChange: (tab: 'dashboard' | 'holdings' | 'history' | 'analysis' | 'realized') => void;
}

const MarketStatus = () => {
  const [status, setStatus] = React.useState<{ isOpen: boolean; label: string; color: string }>({
    isOpen: false,
    label: 'Loading...',
    color: '#787b86'
  });

  React.useEffect(() => {
    const checkMarketStatus = () => {
      const now = new Date();

      // Helper to get parts in timezone
      const getParts = (timeZone: string) => {
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone,
          hour: 'numeric',
          minute: 'numeric',
          hour12: false,
          weekday: 'short'
        });
        const parts = formatter.formatToParts(now);
        const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
        const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
        const weekday = parts.find(p => p.type === 'weekday')?.value;
        return { hour, minute, weekday };
      };

      // Check Taiwan Market (09:00 - 13:30, Mon-Fri)
      const tw = getParts('Asia/Taipei');
      const isTwWeekday = !['Sat', 'Sun'].includes(tw.weekday || '');
      const twTime = tw.hour * 100 + tw.minute;
      const isTwOpen = isTwWeekday && twTime >= 900 && twTime <= 1330;

      // Check US Market (09:30 - 16:00, Mon-Fri)
      const us = getParts('America/New_York');
      const isUsWeekday = !['Sat', 'Sun'].includes(us.weekday || '');
      const usTime = us.hour * 100 + us.minute;
      const isUsOpen = isUsWeekday && usTime >= 930 && usTime <= 1600;

      if (isTwOpen && isUsOpen) {
        setStatus({ isOpen: true, label: 'Markets Open', color: '#00b498' });
      } else if (isTwOpen) {
        setStatus({ isOpen: true, label: 'TW Market Open', color: '#00b498' });
      } else if (isUsOpen) {
        setStatus({ isOpen: true, label: 'US Market Open', color: '#00b498' });
      } else {
        setStatus({ isOpen: false, label: 'Markets Closed', color: '#787b86' });
      }
    };

    checkMarketStatus();
    const interval = setInterval(checkMarketStatus, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-[#2a2e39]/50 rounded border border-[#2a2e39]">
      <div className={clsx("w-2 h-2 rounded-full", status.isOpen && "animate-pulse")} style={{ backgroundColor: status.color }}></div>
      <span className="text-xs font-medium" style={{ color: status.color }}>{status.label}</span>
    </div>
  );
};

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { apiKey, setApiKey } = usePortfolioContext();

  return (
    <div className="min-h-screen bg-[#131722] text-[#d1d4dc] font-sans selection:bg-[#2962ff] selection:text-white">
      {/* Header */}
      <header className="h-14 border-b border-[#2a2e39] bg-[#1e222d] flex items-center justify-between px-4 sticky top-0 z-40 gap-4">
        {/* Logo - Fixed */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-[#2962ff] rounded flex items-center justify-center text-white font-bold text-lg">
            SF
          </div>
          <span className="font-bold text-lg tracking-tight text-[#d1d4dc] hidden sm:inline">StockFolio</span>
          <span className="font-bold text-lg tracking-tight text-[#d1d4dc] sm:hidden">SF</span>
        </div>

        {/* Nav - Scrollable */}
        <nav className="flex items-center gap-1 flex-1 overflow-x-auto min-w-0 px-2 no-scrollbar mask-linear-fade">
          <button
            onClick={() => onTabChange('dashboard')}
            className={clsx(
              "flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors whitespace-nowrap shrink-0",
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
              "flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors whitespace-nowrap shrink-0",
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
              "flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors whitespace-nowrap shrink-0",
              activeTab === 'history'
                ? "text-[#d1d4dc] bg-[#2a2e39]"
                : "text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]/50"
            )}
          >
            <ArrowLeftRight className="w-4 h-4" />
            History
          </button>
          <button
            onClick={() => onTabChange('analysis')}
            className={clsx(
              "flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors whitespace-nowrap shrink-0",
              activeTab === 'analysis'
                ? "text-[#d1d4dc] bg-[#2a2e39]"
                : "text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]/50"
            )}
          >
            <TrendingUp className="w-4 h-4" />
            Analysis
          </button>
          <button
            onClick={() => onTabChange('realized')}
            className={clsx(
              "flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors whitespace-nowrap shrink-0",
              activeTab === 'realized'
                ? "text-[#d1d4dc] bg-[#2a2e39]"
                : "text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]/50"
            )}
          >
            <TrendingUp className="w-4 h-4" />
            Realized
          </button>
        </nav>

        {/* Right Icons - Fixed */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <MarketStatus />
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
      <main className="p-6 max-w-[1800px] mx-auto h-[calc(100vh-3.5rem)] overflow-auto">
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

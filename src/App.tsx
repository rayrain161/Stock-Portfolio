import { useState, useRef } from 'react';
import { PortfolioProvider } from './context/PortfolioContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { HoldingsTable } from './components/HoldingsTable';
import { TransactionForm } from './components/TransactionForm';
import { TransactionHistory } from './components/TransactionHistory';
import { RealizedGains } from './components/RealizedGains';
import { HistoricalAnalysis } from './components/HistoricalAnalysis';

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'holdings' | 'history' | 'analysis' | 'realized'>('dashboard');
  const formButtonRef = useRef<HTMLButtonElement>(null);

  const handleNewTrade = () => {
    // Trigger click on the Add Transaction button
    if (formButtonRef.current) {
      formButtonRef.current.click();
      // Scroll to form after a short delay
      setTimeout(() => {
        formButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  };

  return (
    <PortfolioProvider>
      <Layout activeTab={activeTab} onTabChange={setActiveTab}>
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <Dashboard onNewTrade={handleNewTrade} />
            <div>
              <h2 className="text-xl font-bold text-slate-200 mb-4">Recent Transactions</h2>
              <TransactionForm ref={formButtonRef} />
            </div>
          </div>
        )}

        {activeTab === 'holdings' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-200">Holdings</h2>
              <TransactionForm />
            </div>
            <HoldingsTable />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-200">Transaction History</h2>
            <TransactionHistory />
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-200">Historical Analysis</h2>
            <HistoricalAnalysis />
          </div>
        )}

        {activeTab === 'realized' && (
          <RealizedGains />
        )}
      </Layout>
    </PortfolioProvider>
  );
}

export default App;

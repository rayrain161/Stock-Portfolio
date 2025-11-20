import React, { useState, forwardRef } from 'react';
import { usePortfolioContext } from '../context/PortfolioContext';
import type { Broker, TransactionType, Currency } from '../types';
import { Plus, Save, X } from 'lucide-react';
import { clsx } from 'clsx';
import { calculateFee } from '../utils/calculations';

export const TransactionForm = forwardRef<HTMLButtonElement>((_, ref) => {
  const { addTransaction } = usePortfolioContext();
  const [isOpen, setIsOpen] = useState(false);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    broker: 'FubonTW' as Broker,
    symbol: '',
    type: 'Buy' as TransactionType,
    shares: '',
    price: '',
    fee: '0',
    notes: '',
    currency: 'TWD' as Currency,
  });

  // Auto-set currency based on broker
  React.useEffect(() => {
    const currency: Currency = formData.broker === 'FubonTW' ? 'TWD' : 'USD';
    setFormData(prev => ({ ...prev, currency }));
  }, [formData.broker]);

  // Auto-calculate fee when relevant fields change
  React.useEffect(() => {
    if (formData.shares && formData.price) {
      const shares = parseFloat(formData.shares);
      const price = parseFloat(formData.price);
      if (!isNaN(shares) && !isNaN(price)) {
        const calculatedFee = calculateFee(formData.broker, formData.type, shares, price);
        setFormData(prev => ({ ...prev, fee: calculatedFee.toString() }));
      }
    }
  }, [formData.broker, formData.type, formData.shares, formData.price]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addTransaction({
      id: crypto.randomUUID(),
      date: formData.date,
      broker: formData.broker,
      symbol: formData.symbol.toUpperCase(),
      type: formData.type,
      shares: Number(formData.shares),
      price: Number(formData.price),
      fee: Number(formData.fee),
      notes: formData.notes,
      currency: formData.currency,
    });
    setIsOpen(false);
    setFormData(prev => ({
      ...prev,
      symbol: '',
      shares: '',
      price: '',
      fee: '0',
      notes: '',
    }));
  };

  if (!isOpen) {
    return (
      <button
        ref={ref}
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-[#2962ff] hover:bg-[#1e53dc] text-white rounded font-medium transition-colors text-sm"
      >
        <Plus className="w-4 h-4" />
        Add Transaction
      </button>
    );
  }

  return (
    <div className="bg-[#1e222d] border border-[#2a2e39] rounded p-4 mb-6 animate-in fade-in slide-in-from-top-2 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-[#d1d4dc] uppercase tracking-wide">New Order</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-[#787b86] hover:text-[#d1d4dc] p-1 rounded hover:bg-[#2a2e39]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-[#787b86]">Date</label>
          <input
            type="date"
            required
            value={formData.date}
            onChange={e => setFormData({ ...formData, date: e.target.value })}
            className="w-full bg-[#131722] border border-[#2a2e39] rounded px-3 py-1.5 text-[#d1d4dc] text-sm focus:outline-none focus:border-[#2962ff]"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-[#787b86]">Broker</label>
          <select
            value={formData.broker}
            onChange={e => setFormData({ ...formData, broker: e.target.value as Broker })}
            className="w-full bg-[#131722] border border-[#2a2e39] rounded px-3 py-1.5 text-[#d1d4dc] text-sm focus:outline-none focus:border-[#2962ff]"
          >
            <option value="FubonTW">Fubon TW</option>
            <option value="FubonSub">Fubon Sub</option>
            <option value="Firstrade">Firstrade</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-[#787b86]">Side</label>
          <div className="flex bg-[#131722] rounded p-0.5 border border-[#2a2e39]">
            {(['Buy', 'Sell'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFormData({ ...formData, type })}
                className={clsx(
                  'flex-1 text-xs font-medium py-1 rounded transition-all',
                  formData.type === type
                    ? type === 'Buy'
                      ? 'bg-[#00b498] text-white'
                      : 'bg-[#e22a19] text-white'
                    : 'text-[#787b86] hover:text-[#d1d4dc]'
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-[#787b86]">Symbol</label>
          <input
            type="text"
            required
            placeholder="AAPL"
            value={formData.symbol}
            onChange={e => setFormData({ ...formData, symbol: e.target.value })}
            className="w-full bg-[#131722] border border-[#2a2e39] rounded px-3 py-1.5 text-[#d1d4dc] text-sm focus:outline-none focus:border-[#2962ff] uppercase font-mono"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-[#787b86]">Shares</label>
          <input
            type="number"
            required
            min="0.0001"
            step="any"
            value={formData.shares}
            onChange={e => setFormData({ ...formData, shares: e.target.value })}
            className="w-full bg-[#131722] border border-[#2a2e39] rounded px-3 py-1.5 text-[#d1d4dc] text-sm focus:outline-none focus:border-[#2962ff] font-mono"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-[#787b86]">Price ({formData.currency})</label>
          <input
            type="number"
            required
            min="0"
            step="any"
            value={formData.price}
            onChange={e => setFormData({ ...formData, price: e.target.value })}
            className="w-full bg-[#131722] border border-[#2a2e39] rounded px-3 py-1.5 text-[#d1d4dc] text-sm focus:outline-none focus:border-[#2962ff] font-mono"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-[#787b86]">Fee</label>
          <input
            type="number"
            min="0"
            step="any"
            value={formData.fee}
            onChange={e => setFormData({ ...formData, fee: e.target.value })}
            className="w-full bg-[#131722] border border-[#2a2e39] rounded px-3 py-1.5 text-[#d1d4dc] text-sm focus:outline-none focus:border-[#2962ff] font-mono"
          />
        </div>

        <div className="space-y-1 md:col-span-2 lg:col-span-4 flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-1.5 bg-[#2962ff] hover:bg-[#1e53dc] text-white rounded font-medium transition-colors text-sm shadow-lg shadow-blue-900/20"
          >
            <Save className="w-4 h-4" />
            Submit Order
          </button>
        </div>
      </form>
    </div>
  );
});

const price = parseFloat(formData.price);
if (!isNaN(shares) && !isNaN(price)) {
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
        <label className="text-xs font-medium text-[#787b86]">Price</label>
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
    </form >
  </div >
);
});


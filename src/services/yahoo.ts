export const fetchQuoteYahoo = async (symbol: string): Promise<{ current: number; previousClose?: number } | null> => {
  // Use range=2d&interval=1d to get the last 2 days of data
  const url = `/api/yahoo/v8/finance/chart/${symbol}?range=2d&interval=1d`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    const json = await response.json();

    const result = json.chart?.result?.[0];

    // Get close prices array
    const closePrices = result?.indicators?.quote?.[0]?.close;

    if (closePrices && closePrices.length >= 2) {
      // closePrices[closePrices.length - 1] = today's close (or current if market is open)
      // closePrices[closePrices.length - 2] = previous day's close
      const current = closePrices[closePrices.length - 1];
      const previousClose = closePrices[closePrices.length - 2];

      return {
        current: current || result.meta.regularMarketPrice,
        previousClose: previousClose,
      };
    }

    // Fallback to meta if we don't have close prices array
    if (result?.meta?.regularMarketPrice) {
      return {
        current: result.meta.regularMarketPrice,
        previousClose: result.meta.previousClose,
      };
    }

    return null;
  } catch (error) {
    console.error(`Error fetching Yahoo quote for ${symbol}:`, error);
    return null;
  }
};

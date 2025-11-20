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

    if (closePrices && Array.isArray(closePrices)) {
      // Filter out null values and get valid prices
      const validPrices = closePrices.filter((price: number | null) => price !== null && typeof price === 'number');

      if (validPrices.length >= 2) {
        // validPrices[validPrices.length - 1] = most recent close
        // validPrices[validPrices.length - 2] = previous close
        const current = validPrices[validPrices.length - 1];
        const previousClose = validPrices[validPrices.length - 2];

        return {
          current: current,
          previousClose: previousClose,
        };
      } else if (validPrices.length === 1) {
        // Only one valid price, use it as current
        return {
          current: validPrices[0],
          previousClose: undefined,
        };
      }
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

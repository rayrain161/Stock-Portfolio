export const fetchQuoteYahoo = async (symbol: string): Promise<{ current: number; previousClose?: number } | null> => {
  const url = `/api/yahoo/v8/finance/chart/${symbol}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    const json = await response.json();

    const result = json.chart?.result?.[0];
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

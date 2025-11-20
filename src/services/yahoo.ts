export const fetchQuoteYahoo = async (symbol: string): Promise<number | null> => {
  // Use the local proxy configured in vite.config.ts
  const url = `/api/yahoo/v8/finance/chart/${symbol}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    const json = await response.json();

    // Parse the response based on the user's snippet structure
    // json.chart.result[0].meta.regularMarketPrice
    const result = json.chart?.result?.[0];
    if (result?.meta?.regularMarketPrice) {
      return result.meta.regularMarketPrice;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching Yahoo quote for ${symbol}:`, error);
    return null;
  }
};

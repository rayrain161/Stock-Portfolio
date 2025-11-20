export const fetchQuote = async (symbol: string, apiKey: string): Promise<number | null> => {
  if (!apiKey) return null;

  try {
    const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    // Finnhub returns 'c' as the current price
    return data.c || null;
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    return null;
  }
};

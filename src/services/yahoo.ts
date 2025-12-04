import { api } from './api';

export const fetchQuoteYahoo = async (symbol: string): Promise<{ current: number; previousClose?: number } | null> => {
  try {
    // The API now returns { current: number, previousClose: number } directly
    const data = await api.getPrice(symbol);

    if (data && typeof data.current === 'number') {
      return {
        current: data.current,
        previousClose: data.previousClose,
      };
    }

    return null;
  } catch (error) {
    console.error(`Error fetching Yahoo quote for ${symbol}:`, error);
    return null;
  }
};

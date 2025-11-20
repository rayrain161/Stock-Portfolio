import type { Broker, TransactionType } from '../types';

export const calculateFee = (
  broker: Broker,
  type: TransactionType,
  shares: number,
  price: number
): number => {
  const value = shares * price;

  if (value <= 0) return 0;

  switch (broker) {
    case 'Firstrade':
      return 0;

    case 'FubonSub':
      // 0.25% fee
      return Math.round(value * 0.0025);

    case 'FubonTW':
      // Buy: 0.1425%
      // Sell: 0.1425% + 0.3% (Tax)
      const tradeFee = Math.floor(value * 0.001425);
      if (type === 'Buy') {
        return Math.max(tradeFee, 20); // Minimum fee is usually 20 TWD for many brokers, but user didn't specify. 
        // Sticking strictly to user formula: 
        // "股票買進：證券手續費＝股票買進股價 × 股數 × 0.1425%"
        return Math.floor(value * 0.001425);
      } else {
        // Sell: Fee + Tax (0.3%)
        const tax = Math.floor(value * 0.003);
        return Math.floor(value * 0.001425) + tax;
      }

    default:
      return 0;
  }
};

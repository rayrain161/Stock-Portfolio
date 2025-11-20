export type Broker = 'FubonTW' | 'FubonSub' | 'Firstrade';
export type TransactionType = 'Buy' | 'Sell';
export type Currency = 'TWD' | 'USD';

export interface Transaction {
  id: string;
  date: string;
  broker: Broker;
  symbol: string;
  type: TransactionType;
  shares: number;
  price: number;
  fee: number;
  notes?: string;
  currency?: Currency; // Optional for backwards compatibility
}

export interface Holding {
  symbol: string;
  broker: Broker;
  shares: number;
  avgCost: number;
  currentPrice?: number;
  totalCost: number;
  marketValue: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
  currency?: Currency; // Optional for backwards compatibility
  dayChange?: number; // Daily price change in dollars
  dayChangePercent?: number; // Daily price change in percentage
}

export interface PortfolioStats {
  totalValue: number;
  totalCost: number;
  totalUnrealizedPL: number;
  totalUnrealizedPLPercent: number;
  totalRealizedPL: number;
}

export interface RealizedPosition {
  symbol: string;
  broker: Broker;
  quantity: number;
  dateAcquired: string;
  dateSold: string;
  daysHeld: number;
  acquisitionPrice: number;
  acquisitionFee: number;
  salePrice: number;
  saleFee: number;
  adjustedCost: number;
  salesProceeds: number;
  netGainLoss: number;
  gainLossPercent: number;
  isShortTerm: boolean;
  currency?: Currency; // Optional for backwards compatibility
}

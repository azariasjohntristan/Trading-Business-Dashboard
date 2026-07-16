export interface HealthCheck {
  status: string;
  database: string;
}

export interface User {
  id: string;
  username: string;
}

export interface Account {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Trade {
  id: string;
  accountId: string;
  symbol: string;
  direction: 'LONG' | 'SHORT';
  qty: number;
  buyPrice: number;
  sellPrice: number;
  pnl: number;
  boughtTimestamp: string;
  soldTimestamp: string;
  duration: string | null;
  tradeDate: string;
  chartLink: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ImportHistory {
  id: string;
  accountId: string;
  filename: string;
  tradesDetected: number;
  newTradesImported: number;
  duplicatesSkipped: number;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  errorMessages: string | null;
  importedAt: string;
}

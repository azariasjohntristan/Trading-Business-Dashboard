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
  initialCapital: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface KpiData {
  todayPnl: number;
  todayTrades: number;
  weekPnl: number;
  weekTrades: number;
  weekGrossLoss: number;
  monthPnl: number;
  monthTrades: number;
  totalPnl: number;
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  bestTrade: number;
  worstTrade: number;
  maxDrawdown: number;
}

export interface CalendarDay {
  date: string;
  pnl: number;
  trades: number;
}

export interface DayDetail {
  date: string;
  totalPnl: number;
  totalTrades: number;
  winRate: number;
  trades: Trade[];
}

export interface Trade {
  id: string;
  accountId: string;
  account?: { name: string };
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

export interface PerformanceData {
  equityCurve: { date: string; balance: number }[];
  dailyPnl: { date: string; pnl: number; trades: number }[];
  weeklyPnl: { week: string; pnl: number; trades: number }[];
  monthlyPnl: { month: string; pnl: number; trades: number }[];
  profitFactor: number;
  expectancy: number;
  maxDrawdown: number;
  winStreak: number;
  loseStreak: number;
  totalTrades: number;
  totalPnL: number;
}

export interface DailySession {
  date: string;
  totalPnl: number;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  profitFactor: number;
  bestTrade: number;
  worstTrade: number;
  avgWinner: number;
  avgLoser: number;
  avgHoldMinutes: number;
  firstTradeTime: string | null;
  lastTradeTime: string | null;
  screenshotStatus: 'complete' | 'partial' | 'none';
  trades: Trade[];
}

export interface DailySessionsResponse {
  sessions: DailySession[];
  total: number;
  page: number;
  limit: number;
}

export interface BehaviorData {
  hourly: { hour: number; pnl: number; trades: number; winRate: number }[];
  weekday: { day: string; dayIndex: number; pnl: number; trades: number; winRate: number }[];
  duration: { avgHolding: number; winDuration: number; loseDuration: number };
  direction: {
    long: { pnl: number; trades: number; winRate: number; wins: number };
    short: { pnl: number; trades: number; winRate: number; wins: number };
  };
  execution: { avgQty: number; totalTrades: number };
}

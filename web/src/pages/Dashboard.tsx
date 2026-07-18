import { useEffect, useState, useCallback, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiGet } from '@/lib/api';
import { KpiCard, TradingCalendar, KpiCardSkeleton, formatPnl, formatTime } from '@/design-system';
import { cn } from '@/lib/utils';
import { useSelectedAccount } from '@/contexts/SelectedAccountContext';
import type { KpiData, CalendarDay, Trade, PerformanceData } from '@/types';

interface AccountStat {
  id: string;
  name: string;
  initialCapital: number | null;
  currentBalance: number | null;
  returnPct: number | null;
  totalPnl: number;
  totalTrades: number;
}

export default function Dashboard() {
  const { selectedAccountId } = useSelectedAccount();
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [accountStats, setAccountStats] = useState<AccountStat[]>([]);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [perf, setPerf] = useState<PerformanceData | null>(null);
  const [calMonth, setCalMonth] = useState<{ year: number; month: number }>(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });

  const acctParam = selectedAccountId ? `&accountId=${selectedAccountId}` : '';
  const fetchKpi = useCallback(() => apiGet<KpiData>(`/dashboard/kpi?t=${Date.now()}${acctParam}`).then(setKpi).catch(() => {}), [acctParam]);
  const fetchAccountStats = useCallback(() => apiGet<AccountStat[]>('/accounts/stats').then(setAccountStats).catch(() => {}), []);
  const fetchCalendar = useCallback(async (year: number, month: number) => {
    const data = await apiGet<CalendarDay[]>(`/dashboard/calendar?year=${year}&month=${month}${acctParam}`);
    setCalendarDays(data);
  }, [acctParam]);
  const fetchRecentTrades = useCallback(() => apiGet<Trade[]>(`/trades/recent?t=${Date.now()}${acctParam}`).then(setRecentTrades).catch(() => {}), [acctParam]);
  const fetchPerf = useCallback(() => apiGet<PerformanceData>(`/analytics/performance?t=${Date.now()}${acctParam}`).then(setPerf).catch(() => {}), [acctParam]);

  useEffect(() => {
    fetchKpi(); fetchAccountStats(); fetchCalendar(calMonth.year, calMonth.month); fetchRecentTrades(); fetchPerf();
  }, [fetchKpi, fetchAccountStats, fetchCalendar, fetchRecentTrades, fetchPerf, calMonth]);

  const filteredStats = selectedAccountId ? accountStats.filter(a => a.id === selectedAccountId) : accountStats;
  const totalCapital = filteredStats.reduce((s, a) => s + (a.initialCapital ?? 0), 0);
  const totalBalance = filteredStats.reduce((s, a) => s + (a.currentBalance ?? 0), 0);
  const totalPnlAll = filteredStats.reduce((s, a) => s + a.totalPnl, 0);
  const overallReturnPct = totalCapital > 0 ? Math.round((totalPnlAll / totalCapital) * 10000) / 100 : null;

  const handleDateSelect = (date: string) => {
    setSelectedDate(date === selectedDate ? null : date);
  };

  const handleMonthChange = (year: number, month: number) => {
    setCalMonth({ year, month: month + 1 });
  };

  const calendarWeeks = useMemo(() => {
    const { year, month } = calMonth;
    const monthStart = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayOfWeek = monthStart.getDay();

    const pnlMap = new Map(calendarDays.map(d => [d.date, d]));

    const gridStart = new Date(year, month - 1, 1);
    gridStart.setDate(gridStart.getDate() - firstDayOfWeek);
    const numWeeks = Math.ceil((firstDayOfWeek + daysInMonth) / 7);

    const weeks: { label: string; pnl: number; trades: number }[] = [];

    for (let w = 0; w < numWeeks; w++) {
      let weekPnl = 0;
      let weekTrades = 0;
      for (let d = 0; d < 7; d++) {
        const cellDate = new Date(gridStart);
        cellDate.setDate(gridStart.getDate() + w * 7 + d);
        const dateStr = `${cellDate.getFullYear()}-${String(cellDate.getMonth() + 1).padStart(2, '0')}-${String(cellDate.getDate()).padStart(2, '0')}`;
        const dd = pnlMap.get(dateStr);
        if (dd) {
          weekPnl += dd.pnl;
          weekTrades += dd.trades;
        }
      }
      weeks.push({ label: `Week ${w + 1}`, pnl: Math.round(weekPnl * 100) / 100, trades: weekTrades });
    }

    return weeks;
  }, [calendarDays, calMonth]);

  return (
    <div className="space-y-4 md:space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base md:text-lg font-semibold tracking-tight">Command Center</h1>
          <p className="text-[10px] md:text-[11px] text-muted-foreground">Your trading command center</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-success animate-pulse-subtle" />
          {kpi !== null ? 'System Online' : 'Connecting...'}
        </div>
      </div>

      <div className="stagger-fade-in grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
        {kpi ? (
          <>
            <KpiCard label="Today P&L" value={formatPnl(kpi.todayPnl)} isCurrency trend={kpi.todayPnl > 0 ? 'up' : kpi.todayPnl < 0 ? 'down' : undefined} subtitle={`${kpi.todayTrades} trades`} />
            <KpiCard label="Week P&L" value={formatPnl(kpi.weekPnl)} isCurrency trend={kpi.weekPnl > 0 ? 'up' : 'down'} subtitle={`${kpi.weekTrades} trades`} />
            <KpiCard label="Month P&L" value={formatPnl(kpi.monthPnl)} isCurrency trend={kpi.monthPnl > 0 ? 'up' : 'down'} subtitle={`${kpi.monthTrades} trades`} />
            <KpiCard label="Win Rate" value={`${kpi.winRate}%`} trend={kpi.winRate >= 50 ? 'up' : 'down'} />
            <KpiCard label="Profit Factor" value={kpi.profitFactor === -1 ? '∞' : String(kpi.profitFactor)} />
            <KpiCard label="Trades" value={String(kpi.totalTrades)} subtitle={`${kpi.todayTrades} today`} />
          </>
        ) : (
          Array.from({ length: 6 }).map((_, i) => <KpiCardSkeleton key={i} />)
        )}
      </div>

      <div className="stagger-fade-in grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        <div className="rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-3 card-hover">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Capital</p>
          <p className="text-lg font-bold tabular-nums mt-1">{totalCapital ? `$${totalCapital.toLocaleString()}` : '---'}</p>
        </div>
        <div className="rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-3 card-hover">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Current Balance</p>
          <p className={cn('text-lg font-bold tabular-nums mt-1', totalBalance >= totalCapital ? 'text-success' : 'text-destructive')}>{totalBalance ? `$${totalBalance.toLocaleString()}` : '---'}</p>
        </div>
        <div className="rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-3 card-hover">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Return</p>
          <p className={cn('text-lg font-bold tabular-nums mt-1', overallReturnPct !== null ? (overallReturnPct >= 0 ? 'text-success' : 'text-destructive') : '')}>{overallReturnPct !== null ? `${overallReturnPct >= 0 ? '+' : ''}${overallReturnPct}%` : '---'}</p>
        </div>
        <div className="rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-3 card-hover">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Accounts</p>
          <p className="text-lg font-bold tabular-nums mt-1">{filteredStats.length}</p>
        </div>
      </div>

      <div className="grid gap-4 md:gap-5 lg:grid-cols-4">
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Trading Calendar</h2>
            <span className="text-[10px] text-muted-foreground/60">Click a day to review</span>
          </div>
          <TradingCalendar days={calendarDays} selectedDate={selectedDate} onSelect={handleDateSelect} onMonthChange={handleMonthChange} />
        </div>

        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Weekly Summary</h2>
          <div className="rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-3 md:p-4 card-hover animate-fade-in flex flex-col">
            <div className="flex items-center justify-center h-7 mb-3">
              <span className="text-sm font-semibold text-muted-foreground">Weekly Summary</span>
            </div>
            <div className="py-1 mb-1">
              <span className="text-[10px] md:text-[11px] font-medium text-muted-foreground/50">Week</span>
            </div>
            {calendarWeeks.map((w) => (
              <div key={w.label} className="mb-1 last:mb-0 flex items-center justify-between rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] px-2 py-1.5 min-h-[68px] md:min-h-[80px]">
                <span className="text-[10px] text-muted-foreground">{w.label}</span>
                <span className={`text-xs font-bold tabular-nums ${w.pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatPnl(w.pnl)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-3 md:p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Equity Curve</p>
          {perf && perf.equityCurve.length > 0 && (
            <span className="text-xs text-muted-foreground/60">
              Balance: <span className={cn('tabular-nums', perf.equityCurve[perf.equityCurve.length - 1].balance >= 0 ? 'text-success' : 'text-destructive')}>
                ${perf.equityCurve[perf.equityCurve.length - 1].balance.toLocaleString()}
              </span>
            </span>
          )}
        </div>
        {perf ? (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={perf.equityCurve}>
              <defs>
                <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.2} />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} domain={[dataMin => Math.floor(dataMin * 0.998), dataMax => Math.ceil(dataMax * 1.002)]} tickFormatter={(v) => v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 2, fontSize: 11 }} cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }} formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Balance']} />
              <Area type="monotone" dataKey="balance" stroke="hsl(var(--success))" fill="url(#eqGrad)" strokeWidth={1.5} dot={{ r: 2, fill: 'hsl(var(--success))', stroke: 'none' }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : <div className="h-[260px] flex items-center justify-center text-xs text-muted-foreground">Loading...</div>}
      </div>

      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Recent Trades</h2>
        {recentTrades.length === 0 ? (
          <p className="text-xs text-muted-foreground">No trades yet.</p>
        ) : (
          <div className="rounded border border-[hsl(var(--tv-border))] overflow-hidden">
            {recentTrades.slice(0, 8).map((t, i) => {
              const pnl = Number(t.pnl);
              return (
                <div key={t.id} className={`flex items-center gap-3 px-3 py-2 text-xs ${i % 2 === 0 ? 'bg-[hsl(var(--tv-surface))]' : ''}`}>
                  <span className="w-16 font-semibold">{t.symbol}</span>
                  <span className={`w-14 text-right font-bold tabular-nums ${pnl >= 0 ? 'text-success' : 'text-destructive'}`}>{formatPnl(pnl)}</span>
                  <span className="w-10 text-muted-foreground/60">{formatTime(t.soldTimestamp)}</span>
                  <span className="text-muted-foreground/40">{t.direction}</span>
                  <span className="ml-auto text-muted-foreground/40">{new Date(t.soldTimestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiGet } from '@/lib/api';
import { KpiCard, TradingCalendar, DailyReviewPanel, TradeCard, KpiCardSkeleton, formatPnl } from '@/design-system';
import type { KpiData, CalendarDay, DayDetail, Trade, PerformanceData } from '@/types';

export default function Dashboard() {
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayDetail, setDayDetail] = useState<DayDetail | null>(null);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [perf, setPerf] = useState<PerformanceData | null>(null);

  const fetchKpi = useCallback(() => apiGet<KpiData>('/dashboard/kpi').then(setKpi).catch(() => {}), []);
  const fetchCalendar = useCallback(() => apiGet<CalendarDay[]>('/dashboard/calendar').then(setCalendarDays).catch(() => {}), []);
  const fetchRecentTrades = useCallback(() => apiGet<Trade[]>('/trades/recent').then(setRecentTrades).catch(() => {}), []);
  const fetchPerf = useCallback(() => apiGet<PerformanceData>('/analytics/performance').then(setPerf).catch(() => {}), []);

  useEffect(() => {
    fetchKpi(); fetchCalendar(); fetchRecentTrades(); fetchPerf();
  }, [fetchKpi, fetchCalendar, fetchRecentTrades, fetchPerf]);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    apiGet<DayDetail>(`/dashboard/calendar/${date}`).then(setDayDetail).catch(() => {});
  };

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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
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

      <div className="grid gap-4 md:gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Trading Calendar</h2>
            <span className="text-[10px] text-muted-foreground/60">Click a day to review</span>
          </div>
          <TradingCalendar days={calendarDays} selectedDate={selectedDate} onSelect={handleDateSelect} />
        </div>

        <div className="space-y-3">
          {selectedDate && dayDetail ? (
            <DailyReviewPanel date={selectedDate} detail={dayDetail} onClose={() => { setSelectedDate(null); setDayDetail(null); }} />
          ) : (
            <div className="rounded border border-dashed border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-6 flex items-center justify-center h-full min-h-[200px]">
              <p className="text-xs text-muted-foreground text-center">Select a day from the calendar to review your trades</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:gap-5 lg:grid-cols-2">
        <div className="rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-3 md:p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Equity Curve</p>
          {perf ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={perf.equityCurve}>
                <defs>
                  <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(170 92% 31%)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(170 92% 31%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.2} />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 2, fontSize: 11 }} formatter={(v) => [formatPnl(Number(v)), 'P&L']} />
                <Area type="monotone" dataKey="cumulativePnl" stroke="hsl(170 92% 31%)" fill="url(#eqGrad)" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">Loading...</div>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent Trades</h2>
          </div>
          <div className="grid gap-2">
            {recentTrades.length === 0 ? (
              <p className="text-xs text-muted-foreground">No trades yet.</p>
            ) : (
              recentTrades.slice(0, 5).map((t) => <TradeCard key={t.id} trade={t} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

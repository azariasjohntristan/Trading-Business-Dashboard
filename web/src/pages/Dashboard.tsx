import { useEffect, useState, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { apiGet } from '@/lib/api';
import { cn } from '@/lib/utils';
import { KpiCard, TradingCalendar, TradeCard, StatusBadge, KpiCardSkeleton, TradeCardSkeleton, formatPnl, SectionHeader } from '@/design-system';
import type { KpiData, CalendarDay, DayDetail, Trade, PerformanceData } from '@/types';

const viewOptions = ['daily', 'weekly', 'monthly'] as const;

function DayDetailPanel({ date, detail }: { date: string; detail: DayDetail | null }) {
  if (!detail) return null;

  const sorted = [...detail.trades].sort((a, b) => Math.abs(Number(b.pnl)) - Math.abs(Number(a.pnl)));
  const best = sorted.find(t => Number(t.pnl) >= 0) ?? null;
  const worst = sorted.find(t => Number(t.pnl) < 0) ?? null;

  return (
    <div className="rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-3 animate-fade-in">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">{date}</span>
        <div className="flex items-center gap-3 text-[11px]">
          <span className={detail.totalPnl >= 0 ? 'text-success' : 'text-destructive'}>{formatPnl(detail.totalPnl)}</span>
          <span className="text-muted-foreground">{detail.totalTrades} trades</span>
          <span className="text-muted-foreground">{detail.winRate}% WR</span>
        </div>
      </div>

      {best && worst && (
        <div className="mb-2 grid grid-cols-2 gap-2">
          <div className="rounded-sm bg-success/5 border border-success/10 p-2">
            <p className="text-[9px] uppercase tracking-wider text-success mb-0.5">Best Trade</p>
            <p className="text-xs font-semibold text-success">{best.symbol}</p>
            <p className="text-[10px] text-success">{formatPnl(Number(best.pnl))}</p>
          </div>
          <div className="rounded-sm bg-destructive/5 border border-destructive/10 p-2">
            <p className="text-[9px] uppercase tracking-wider text-destructive mb-0.5">Worst Trade</p>
            <p className="text-xs font-semibold text-destructive">{worst.symbol}</p>
            <p className="text-[10px] text-destructive">{formatPnl(Number(worst.pnl))}</p>
          </div>
        </div>
      )}

      <div className="space-y-px max-h-48 overflow-y-auto">
        {detail.trades.map((t) => (
          <div key={t.id} className="flex items-center justify-between rounded-sm bg-muted/30 px-2 py-1 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{t.symbol}</span>
              <StatusBadge variant={t.direction === 'LONG' ? 'long' : 'short'}>{t.direction}</StatusBadge>
            </div>
            <span className={cn('tabular-nums', Number(t.pnl) >= 0 ? 'text-success' : 'text-destructive')}>
              {formatPnl(Number(t.pnl))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayDetail, setDayDetail] = useState<DayDetail | null>(null);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [perf, setPerf] = useState<PerformanceData | null>(null);
  const [perfView, setPerfView] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const fetchKpi = useCallback(() => apiGet<KpiData>('/dashboard/kpi').then(setKpi).catch(() => {}), []);
  const fetchCalendar = useCallback(() => apiGet<CalendarDay[]>('/dashboard/calendar').then(setCalendarDays).catch(() => {}), []);
  const fetchRecentTrades = useCallback(() => apiGet<Trade[]>('/trades/recent').then(setRecentTrades).catch(() => {}), []);
  const fetchPerf = useCallback(() => apiGet<PerformanceData>('/analytics/performance').then(setPerf).catch(() => {}), []);

  useEffect(() => {
    fetchKpi();
    fetchCalendar();
    fetchRecentTrades();
    fetchPerf();
  }, [fetchKpi, fetchCalendar, fetchRecentTrades, fetchPerf]);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    apiGet<DayDetail>(`/dashboard/calendar/${date}`).then(setDayDetail).catch(() => {});
  };

  const pnlData = perf
    ? perfView === 'daily' ? perf.dailyPnl
      : perfView === 'weekly' ? perf.weeklyPnl.map(d => ({ ...d, date: d.week }))
      : perf.monthlyPnl.map(d => ({ ...d, date: d.month }))
    : [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold tracking-tight">Command Center</h1>
          <p className="text-[11px] text-muted-foreground">Your trading command center</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-success animate-pulse-subtle" />
          {kpi !== null ? 'System Online' : 'Connecting...'}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {kpi ? (
          <>
            <KpiCard label="Today P&L" value={formatPnl(kpi.todayPnl)} isCurrency trend={kpi.todayPnl > 0 ? 'up' : kpi.todayPnl < 0 ? 'down' : undefined} subtitle={`${kpi.todayTrades} trades`} />
            <KpiCard label="Week P&L" value={formatPnl(kpi.weekPnl)} isCurrency trend={kpi.weekPnl > 0 ? 'up' : kpi.weekPnl < 0 ? 'down' : undefined} subtitle={`${kpi.weekTrades} trades`} />
            <KpiCard label="Month P&L" value={formatPnl(kpi.monthPnl)} isCurrency trend={kpi.monthPnl > 0 ? 'up' : kpi.monthPnl < 0 ? 'down' : undefined} subtitle={`${kpi.monthTrades} trades`} />
            <KpiCard label="Total P&L" value={formatPnl(kpi.totalPnl)} isCurrency trend={kpi.totalPnl > 0 ? 'up' : kpi.totalPnl < 0 ? 'down' : undefined} subtitle={`${kpi.totalTrades} trades`} />
            <KpiCard label="Win Rate" value={`${kpi.winRate}%`} trend={kpi.winRate >= 50 ? 'up' : 'down'} />
            <KpiCard label="Profit Factor" value={kpi.profitFactor === -1 ? '∞' : String(kpi.profitFactor)} />
            <KpiCard label="Total Trades" value={String(kpi.totalTrades)} />
            <KpiCard label="System" value="Online" />
          </>
        ) : (
          Array.from({ length: 8 }).map((_, i) => <KpiCardSkeleton key={i} />)
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-3">
          <SectionHeader title="P&L Calendar" subtitle="Click a day to review" />
          <TradingCalendar days={calendarDays} selectedDate={selectedDate} onSelect={handleDateSelect} />
          {selectedDate && dayDetail && <DayDetailPanel date={selectedDate} detail={dayDetail} />}
        </div>

        <div className="lg:col-span-2 space-y-3">
          <SectionHeader title="Performance" action={
            <div className="flex gap-1">
              {viewOptions.map((v) => (
                <button
                  key={v}
                  onClick={() => setPerfView(v)}
                  className={cn('rounded-sm px-2 py-1 text-[10px] font-medium transition-colors', perfView === v ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80')}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          } />
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Equity Curve</p>
              {perf ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={perf.equityCurve}>
                    <defs>
                      <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(170 92% 31%)" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="hsl(170 92% 31%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 4, fontSize: 11 }} formatter={(v) => [formatPnl(Number(v)), 'P&L']} />
                    <Area type="monotone" dataKey="cumulativePnl" stroke="hsl(170 92% 31%)" fill="url(#eqGrad)" strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-[11px] text-muted-foreground">Loading...</div>
              )}
            </div>
            <div className="rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">P&L Over Time</p>
              {perf ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={pnlData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 4, fontSize: 11 }} formatter={(v) => [formatPnl(Number(v)), 'P&L']} />
                    <Bar dataKey="pnl" fill="hsl(170 92% 31%)" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-[11px] text-muted-foreground">Loading...</div>
              )}
            </div>
          </div>

          <SectionHeader title="Recent Trades" />
          <div className="grid gap-2 sm:grid-cols-2">
            {recentTrades.length === 0 ? (
              <p className="text-xs text-muted-foreground col-span-2">No trades yet.</p>
            ) : (
              recentTrades.slice(0, 6).map((t) => <TradeCard key={t.id} trade={t} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

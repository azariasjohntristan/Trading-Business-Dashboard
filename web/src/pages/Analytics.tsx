import { useEffect, useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { apiGet } from '@/lib/api';
import { cn } from '@/lib/utils';
import { formatPnl, SectionHeader, KpiCardSkeleton } from '@/design-system';
import type { PerformanceData, BehaviorData } from '@/types';

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-3 animate-fade-in">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">{title}</p>
      {children}
    </div>
  );
}

function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function Analytics() {
  const [perf, setPerf] = useState<PerformanceData | null>(null);
  const [behav, setBehav] = useState<BehaviorData | null>(null);
  const [perfView, setPerfView] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  useEffect(() => {
    apiGet<PerformanceData>('/analytics/performance').then(setPerf).catch(() => {});
    apiGet<BehaviorData>('/analytics/behavior').then(setBehav).catch(() => {});
  }, []);

  const pnlData = perf
    ? perfView === 'daily' ? perf.dailyPnl
      : perfView === 'weekly' ? perf.weeklyPnl.map(d => ({ ...d, date: d.week }))
      : perf.monthlyPnl.map(d => ({ ...d, date: d.month }))
    : [];

  const wins = behav ? behav.direction.long.wins + behav.direction.short.wins : 0;
  const losses = perf ? perf.totalTrades - wins : 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-base font-semibold tracking-tight">Analytics</h1>
        <p className="text-[11px] text-muted-foreground">Trading intelligence center</p>
      </div>

      <SectionHeader title="Performance Overview" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {perf ? (
          <>
            <div className="rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total P&L</p>
              <p className={cn('text-lg font-bold tabular-nums mt-1', perf.totalPnL >= 0 ? 'text-success' : 'text-destructive')}>{formatPnl(perf.totalPnL)}</p>
            </div>
            <div className="rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Win Rate</p>
              <p className="text-lg font-bold tabular-nums mt-1">{perf.totalTrades > 0 ? `${((wins / perf.totalTrades) * 100).toFixed(1)}%` : '---'}</p>
            </div>
            <div className="rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Profit Factor</p>
              <p className="text-lg font-bold tabular-nums mt-1">{perf.profitFactor === -1 ? '∞' : perf.profitFactor.toFixed(2)}</p>
            </div>
            <div className="rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Expectancy</p>
              <p className={cn('text-lg font-bold tabular-nums mt-1', perf.expectancy >= 0 ? 'text-success' : 'text-destructive')}>{formatPnl(perf.expectancy)}</p>
            </div>
            <div className="rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Max Drawdown</p>
              <p className="text-lg font-bold tabular-nums mt-1 text-destructive">{formatPnl(perf.maxDrawdown)}</p>
            </div>
            <div className="rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Trades</p>
              <p className="text-lg font-bold tabular-nums mt-1">{perf.totalTrades}</p>
            </div>
            <div className="rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Win Streak</p>
              <p className="text-lg font-bold tabular-nums mt-1 text-success">{perf.winStreak}</p>
            </div>
            <div className="rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Lose Streak</p>
              <p className="text-lg font-bold tabular-nums mt-1 text-destructive">{perf.loseStreak}</p>
            </div>
          </>
        ) : (
          Array.from({ length: 8 }).map((_, i) => <KpiCardSkeleton key={i} />)
        )}
      </div>

      <SectionHeader title="Growth Analytics" />
      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Equity Curve">
          {perf ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={perf.equityCurve}>
                <defs>
                  <linearGradient id="eqGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(170 92% 31%)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(170 92% 31%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 4, fontSize: 11 }} formatter={(v) => [formatPnl(Number(v)), 'P&L']} />
                <Area type="monotone" dataKey="cumulativePnl" stroke="hsl(170 92% 31%)" fill="url(#eqGrad2)" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className="h-[280px] flex items-center justify-center text-xs text-muted-foreground">Loading...</div>}
        </ChartCard>

        <ChartCard title="P&L Over Time">
          <div className="mb-2 flex gap-1">
            {(['daily', 'weekly', 'monthly'] as const).map((v) => (
              <button key={v} onClick={() => setPerfView(v)} className={cn('rounded-sm px-2 py-1 text-[10px] font-medium transition-colors', perfView === v ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80')}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          {perf ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={pnlData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 4, fontSize: 11 }} formatter={(v) => [formatPnl(Number(v)), 'P&L']} />
                <Bar dataKey="pnl" fill="hsl(170 92% 31%)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-[250px] flex items-center justify-center text-xs text-muted-foreground">Loading...</div>}
        </ChartCard>
      </div>

      <SectionHeader title="Trading Behavior" />
      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="P&L by Hour">
          {behav ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={behav.hourly}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                <XAxis dataKey="hour" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 4, fontSize: 11 }} formatter={(v) => [formatPnl(Number(v)), 'P&L']} />
                <Bar dataKey="pnl" fill="hsl(170 92% 31%)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-[250px] flex items-center justify-center text-xs text-muted-foreground">Loading...</div>}
        </ChartCard>

        <ChartCard title="P&L by Weekday">
          {behav ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={behav.weekday}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                <XAxis dataKey="day" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 4, fontSize: 11 }} formatter={(v) => [formatPnl(Number(v)), 'P&L']} />
                <Bar dataKey="pnl" fill="hsl(170 92% 31%)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-[250px] flex items-center justify-center text-xs text-muted-foreground">Loading...</div>}
        </ChartCard>

        <ChartCard title="Direction Analysis">
          {behav ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[
                  { name: 'Long', pnl: behav.direction.long.pnl, trades: behav.direction.long.trades },
                  { name: 'Short', pnl: behav.direction.short.pnl, trades: behav.direction.short.trades },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 4, fontSize: 11 }} formatter={(v) => [formatPnl(Number(v)), 'P&L']} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="pnl" fill="hsl(170 92% 31%)" radius={[2, 2, 0, 0]} name="P&L" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-sm bg-success/5 border border-success/10 p-2">
                  <p className="font-medium text-success text-[11px]">Long</p>
                  <p className="tabular-nums text-success">{formatPnl(behav.direction.long.pnl)}</p>
                  <p className="text-muted-foreground text-[10px]">{behav.direction.long.trades} trades, {behav.direction.long.winRate}% WR</p>
                </div>
                <div className="rounded-sm bg-destructive/5 border border-destructive/10 p-2">
                  <p className="font-medium text-destructive text-[11px]">Short</p>
                  <p className="tabular-nums text-destructive">{formatPnl(behav.direction.short.pnl)}</p>
                  <p className="text-muted-foreground text-[10px]">{behav.direction.short.trades} trades, {behav.direction.short.winRate}% WR</p>
                </div>
              </div>
            </>
          ) : <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">Loading...</div>}
        </ChartCard>

        <ChartCard title="Duration Analysis">
          {behav ? (
            <div className="space-y-3">
              <div className="rounded-sm bg-muted/50 p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Average Holding Time</p>
                <p className="text-2xl font-bold tabular-nums mt-1">{formatMinutes(behav.duration.avgHolding)}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-sm bg-success/5 border border-success/10 p-3 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Win Duration</p>
                  <p className="text-lg font-bold text-success tabular-nums mt-1">{formatMinutes(behav.duration.winDuration)}</p>
                </div>
                <div className="rounded-sm bg-destructive/5 border border-destructive/10 p-3 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Lose Duration</p>
                  <p className="text-lg font-bold text-destructive tabular-nums mt-1">{formatMinutes(behav.duration.loseDuration)}</p>
                </div>
              </div>
            </div>
          ) : <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">Loading...</div>}
        </ChartCard>

        <ChartCard title="Execution Analysis">
          {behav ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-sm bg-muted/50 p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg Quantity</p>
                <p className="text-2xl font-bold tabular-nums mt-1">{behav.execution.avgQty.toFixed(1)}</p>
              </div>
              <div className="rounded-sm bg-muted/50 p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Trades</p>
                <p className="text-2xl font-bold tabular-nums mt-1">{behav.execution.totalTrades}</p>
              </div>
            </div>
          ) : <div className="h-[120px] flex items-center justify-center text-xs text-muted-foreground">Loading...</div>}
        </ChartCard>
      </div>
    </div>
  );
}

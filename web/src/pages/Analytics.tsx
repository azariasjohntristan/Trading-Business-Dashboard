import { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { apiGet } from '@/lib/api';
import { cn } from '@/lib/utils';
import { formatPnl } from '@/design-system';
import type { PerformanceData, BehaviorData } from '@/types';

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
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

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Analytics</h1>
        <p className="text-xs text-muted-foreground">Performance and behavior analysis</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border bg-card p-3">
          <p className="text-[11px] text-muted-foreground">Total P&L</p>
          <p className={cn('text-lg font-bold tabular-nums', perf && perf.totalPnL >= 0 ? 'text-success' : perf && perf.totalPnL < 0 ? 'text-destructive' : '')}>
            {perf ? formatPnl(perf.totalPnL) : '---'}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <p className="text-[11px] text-muted-foreground">Profit Factor</p>
          <p className="text-lg font-bold tabular-nums">{perf ? (perf.profitFactor === -1 ? '∞' : String(perf.profitFactor)) : '---'}</p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <p className="text-[11px] text-muted-foreground">Expectancy</p>
          <p className={cn('text-lg font-bold tabular-nums', perf && perf.expectancy >= 0 ? 'text-success' : perf && perf.expectancy < 0 ? 'text-destructive' : '')}>
            {perf ? formatPnl(perf.expectancy) : '---'}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <p className="text-[11px] text-muted-foreground">Max Drawdown</p>
          <p className="text-lg font-bold tabular-nums text-destructive">{perf ? formatPnl(perf.maxDrawdown) : '---'}</p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <p className="text-[11px] text-muted-foreground">Total Trades</p>
          <p className="text-lg font-bold tabular-nums">{perf ? String(perf.totalTrades) : '---'}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border bg-card p-3">
          <p className="text-[11px] text-muted-foreground">Win Streak</p>
          <p className="text-lg font-bold tabular-nums text-success">{perf ? String(perf.winStreak) : '---'}</p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <p className="text-[11px] text-muted-foreground">Lose Streak</p>
          <p className="text-lg font-bold tabular-nums text-destructive">{perf ? String(perf.loseStreak) : '---'}</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Equity Curve">
          {perf ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={perf.equityCurve}>
                <defs>
                  <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(170 92% 31%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(170 92% 31%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 4, fontSize: 12 }}
                  formatter={(value) => [formatPnl(Number(value)), 'P&L']}
                />
                <Area type="monotone" dataKey="cumulativePnl" stroke="hsl(170 92% 31%)" fill="url(#eqGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-muted-foreground">No data yet.</p>
          )}
        </ChartCard>

        <ChartCard title="P&L Over Time">
          <div className="mb-2 flex gap-1">
            {(['daily', 'weekly', 'monthly'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setPerfView(v)}
                className={cn(
                  'rounded-sm px-2 py-1 text-[11px] font-medium transition-colors',
                  perfView === v ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80',
                )}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          {perf ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={pnlData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 4, fontSize: 12 }}
                  formatter={(value) => [formatPnl(Number(value)), 'P&L']}
                />
                <Bar dataKey="pnl" fill="hsl(170 92% 31%)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-muted-foreground">No data yet.</p>
          )}
        </ChartCard>
      </div>

      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Trading Behavior</h2>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="P&L by Hour">
          {behav ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={behav.hourly}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 4, fontSize: 12 }}
                  formatter={(value) => [formatPnl(Number(value)), 'P&L']}
                />
                <Bar dataKey="pnl" fill="hsl(170 92% 31%)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-muted-foreground">No data yet.</p>
          )}
        </ChartCard>

        <ChartCard title="P&L by Weekday">
          {behav ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={behav.weekday}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 4, fontSize: 12 }}
                  formatter={(value) => [formatPnl(Number(value)), 'P&L']}
                />
                <Bar dataKey="pnl" fill="hsl(170 92% 31%)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-muted-foreground">No data yet.</p>
          )}
        </ChartCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Direction Analysis">
          {behav ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[
                { name: 'Long', pnl: behav.direction.long.pnl, trades: behav.direction.long.trades },
                { name: 'Short', pnl: behav.direction.short.pnl, trades: behav.direction.short.trades },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 4, fontSize: 12 }}
                  formatter={(value) => [formatPnl(Number(value)), 'P&L']}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="pnl" fill="hsl(170 92% 31%)" radius={[2, 2, 0, 0]} name="P&L" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-muted-foreground">No data yet.</p>
          )}
          {behav && (
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded bg-success/5 p-2 border border-success/10">
                <p className="font-medium text-success">Long</p>
                <p className="tabular-nums">{formatPnl(behav.direction.long.pnl)}</p>
                <p className="text-muted-foreground">{behav.direction.long.trades} trades</p>
                <p className="text-muted-foreground">{behav.direction.long.winRate}% win rate</p>
              </div>
              <div className="rounded bg-destructive/5 p-2 border border-destructive/10">
                <p className="font-medium text-destructive">Short</p>
                <p className="tabular-nums">{formatPnl(behav.direction.short.pnl)}</p>
                <p className="text-muted-foreground">{behav.direction.short.trades} trades</p>
                <p className="text-muted-foreground">{behav.direction.short.winRate}% win rate</p>
              </div>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Duration Analysis">
          {behav ? (
            <div className="space-y-3">
              <div className="rounded bg-muted/50 p-3 text-center">
                <p className="text-[11px] text-muted-foreground">Average Holding Time</p>
                <p className="text-xl font-bold tabular-nums">{formatMinutes(behav.duration.avgHolding)}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded bg-success/5 p-3 text-center border border-success/10">
                  <p className="text-[11px] text-muted-foreground">Win Duration</p>
                  <p className="text-lg font-bold text-success tabular-nums">{formatMinutes(behav.duration.winDuration)}</p>
                </div>
                <div className="rounded bg-destructive/5 p-3 text-center border border-destructive/10">
                  <p className="text-[11px] text-muted-foreground">Lose Duration</p>
                  <p className="text-lg font-bold text-destructive tabular-nums">{formatMinutes(behav.duration.loseDuration)}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No data yet.</p>
          )}
        </ChartCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Execution Analysis">
          {behav ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded bg-muted/50 p-3 text-center">
                <p className="text-[11px] text-muted-foreground">Avg Quantity</p>
                <p className="text-xl font-bold tabular-nums">{behav.execution.avgQty}</p>
              </div>
              <div className="rounded bg-muted/50 p-3 text-center">
                <p className="text-[11px] text-muted-foreground">Total Trades</p>
                <p className="text-xl font-bold tabular-nums">{behav.execution.totalTrades}</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No data yet.</p>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

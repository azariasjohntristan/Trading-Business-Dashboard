import { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { apiGet } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { PerformanceData, BehaviorData } from '@/types';

function formatPnl(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', signDisplay: 'always' }).format(value);
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function KpiCard({ label, value, isPnl }: { label: string; value: string; isPnl?: boolean }) {
  const isNegative = isPnl && value.startsWith('-');
  return (
    <div className="rounded-lg border bg-card p-3 text-card-foreground shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('text-lg font-bold', isPnl && (isNegative ? 'text-destructive' : 'text-success'))}>
        {value}
      </p>
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">Performance and behavior analysis</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="Total P&L" value={perf ? formatPnl(perf.totalPnL) : '---'} isPnl />
        <KpiCard label="Profit Factor" value={perf ? (perf.profitFactor === -1 ? '∞' : String(perf.profitFactor)) : '---'} />
        <KpiCard label="Expectancy" value={perf ? formatPnl(perf.expectancy) : '---'} isPnl />
        <KpiCard label="Max Drawdown" value={perf ? formatPnl(perf.maxDrawdown) : '---'} isPnl />
        <KpiCard label="Total Trades" value={perf ? String(perf.totalTrades) : '---'} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <KpiCard label="Win Streak" value={perf ? String(perf.winStreak) : '---'} />
        <KpiCard label="Lose Streak" value={perf ? String(perf.loseStreak) : '---'} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Equity Curve">
          {perf ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={perf.equityCurve}>
                <defs>
                  <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142.1 76% 36%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142.1 76% 36%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 6 }}
                  formatter={(value: number) => [formatPnl(value), 'P&L']}
                />
                <Area type="monotone" dataKey="cumulativePnl" stroke="hsl(142.1 76% 36%)" fill="url(#eqGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          )}
        </ChartCard>

        <ChartCard title="P&L Over Time">
          <div className="mb-2 flex gap-2">
            {(['daily', 'weekly', 'monthly'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setPerfView(v)}
                className={cn(
                  'rounded px-2 py-1 text-xs font-medium transition-colors',
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
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 6 }}
                  formatter={(value: number) => [formatPnl(value), 'P&L']}
                />
                <Bar dataKey="pnl" fill="hsl(142.1 76% 36%)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          )}
        </ChartCard>
      </div>

      <h2 className="text-xl font-semibold">Trading Behavior</h2>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="P&L by Hour">
          {behav ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={behav.hourly}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 6 }}
                  formatter={(value: number) => [formatPnl(value), 'P&L']}
                />
                <Bar dataKey="pnl" fill="hsl(142.1 76% 36%)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground">No data yet.</p>
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
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 6 }}
                  formatter={(value: number) => [formatPnl(value), 'P&L']}
                />
                <Bar dataKey="pnl" fill="hsl(142.1 76% 36%)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          )}
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
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
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 6 }}
                  formatter={(value: number) => [formatPnl(value), 'P&L']}
                />
                <Legend />
                <Bar dataKey="pnl" fill="hsl(142.1 76% 36%)" radius={[2, 2, 0, 0]} name="P&L" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          )}
          {behav && (
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded bg-muted/50 p-2">
                <p className="font-medium text-success">Long</p>
                <p>{formatPnl(behav.direction.long.pnl)}</p>
                <p>{behav.direction.long.trades} trades</p>
                <p>{behav.direction.long.winRate}% win rate</p>
              </div>
              <div className="rounded bg-muted/50 p-2">
                <p className="font-medium text-destructive">Short</p>
                <p>{formatPnl(behav.direction.short.pnl)}</p>
                <p>{behav.direction.short.trades} trades</p>
                <p>{behav.direction.short.winRate}% win rate</p>
              </div>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Duration Analysis">
          {behav ? (
            <div className="space-y-3">
              <div className="rounded bg-muted/50 p-3 text-center">
                <p className="text-xs text-muted-foreground">Average Holding Time</p>
                <p className="text-xl font-bold">{formatMinutes(behav.duration.avgHolding)}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded bg-success/10 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Win Duration</p>
                  <p className="text-lg font-bold text-success">{formatMinutes(behav.duration.winDuration)}</p>
                </div>
                <div className="rounded bg-destructive/10 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Lose Duration</p>
                  <p className="text-lg font-bold text-destructive">{formatMinutes(behav.duration.loseDuration)}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          )}
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Execution Analysis">
          {behav ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded bg-muted/50 p-3 text-center">
                <p className="text-xs text-muted-foreground">Avg Quantity</p>
                <p className="text-xl font-bold">{behav.execution.avgQty}</p>
              </div>
              <div className="rounded bg-muted/50 p-3 text-center">
                <p className="text-xs text-muted-foreground">Total Trades</p>
                <p className="text-xl font-bold">{behav.execution.totalTrades}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

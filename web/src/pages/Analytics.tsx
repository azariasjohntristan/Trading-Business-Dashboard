import { useEffect, useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { apiGet } from '@/lib/api';
import { cn } from '@/lib/utils';
import { formatPnl, SectionHeader, KpiCardSkeleton } from '@/design-system';
import { useSelectedAccount } from '@/contexts/SelectedAccountContext';
import type { PerformanceData, BehaviorData } from '@/types';

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-3 md:p-4 card-hover animate-fade-in">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">{title}</p>
      {children}
    </div>
  );
}

function KpiBlock({ label, value, isPnl, className }: { label: string; value: string; isPnl?: boolean; className?: string }) {
  const negative = isPnl && value.startsWith('-');
  return (
    <div className={cn('rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-3 card-hover', className)}>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn('text-lg md:text-xl font-bold tabular-nums mt-1', isPnl && (negative ? 'text-destructive' : 'text-success'))}>{value}</p>
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
  const { selectedAccountId } = useSelectedAccount();
  const [perf, setPerf] = useState<PerformanceData | null>(null);
  const [behav, setBehav] = useState<BehaviorData | null>(null);
  const [perfView, setPerfView] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [timeView, setTimeView] = useState<'pnl' | 'winrate'>('pnl');
  const acctParam = selectedAccountId ? `&accountId=${selectedAccountId}` : '';

  useEffect(() => {
    apiGet<PerformanceData>(`/analytics/performance?t=${Date.now()}${acctParam}`).then(setPerf).catch(() => {});
    apiGet<BehaviorData>(`/analytics/behavior?t=${Date.now()}${acctParam}`).then(setBehav).catch(() => {});
  }, [acctParam]);

  const pnlData = perf
    ? perfView === 'daily' ? perf.dailyPnl
      : perfView === 'weekly' ? perf.weeklyPnl.map(d => ({ ...d, date: d.week }))
      : perf.monthlyPnl.map(d => ({ ...d, date: d.month }))
    : [];

  const wins = behav ? behav.direction.long.wins + behav.direction.short.wins : 0;
  const totalTrades = perf?.totalTrades ?? 0;
  const losses = totalTrades - wins;

  let avgWin: string = '---';
  let avgLoss: string = '---';
  let avgRrr: string = '---';
  let grossProfitStr: string = '---';
  let grossLossStr: string = '---';
  let recoveryFactor: string = '---';
  let profitableDaysPct: string = '---';
  let avgDayPnl: string = '---';
  let bestDayStr: string = '---';
  let worstDayStr: string = '---';
  if (perf && behav) {
    const pf = perf.profitFactor;
    const tp = perf.totalPnL;
    let gp = 0, gl = 0;
    if (pf === -1) { gp = tp; gl = 0; }
    else if (pf === 0) { gp = 0; gl = Math.abs(tp); }
    else { gl = tp / (pf - 1); gp = pf * gl; }
    if (wins > 0) avgWin = formatPnl(gp / wins);
    if (losses > 0) avgLoss = formatPnl(-gl / losses);
    const winVal = wins > 0 ? gp / wins : 0;
    const lossVal = losses > 0 ? gl / losses : 0;
    if (lossVal > 0) avgRrr = (winVal / lossVal).toFixed(2);
    grossProfitStr = formatPnl(gp);
    grossLossStr = formatPnl(-gl);
    recoveryFactor = perf.maxDrawdown > 0 ? (perf.totalPnL / perf.maxDrawdown).toFixed(2) : '---';
    const totalDays = perf.dailyPnl.length;
    const profitableDays = perf.dailyPnl.filter(d => d.pnl > 0).length;
    profitableDaysPct = totalDays > 0 ? ((profitableDays / totalDays) * 100).toFixed(1) : '---';
    avgDayPnl = totalDays > 0 ? formatPnl(perf.totalPnL / totalDays) : '---';
    if (totalDays > 0) {
      const sorted = [...perf.dailyPnl].sort((a, b) => b.pnl - a.pnl);
      bestDayStr = formatPnl(sorted[0].pnl);
      worstDayStr = formatPnl(sorted[sorted.length - 1].pnl);
    }
  }

  const bestWeekday = behav ? [...behav.weekday].sort((a, b) => b.pnl - a.pnl)[0] : null;
  const worstWeekday = behav ? [...behav.weekday].sort((a, b) => a.pnl - b.pnl)[0] : null;
  const bestHour = behav ? [...behav.hourly].sort((a, b) => b.pnl - a.pnl)[0] : null;
  const worstHour = behav ? [...behav.hourly].sort((a, b) => a.pnl - b.pnl)[0] : null;

  return (
    <div className="space-y-4 md:space-y-5">
      <div>
        <h1 className="text-base md:text-lg font-semibold tracking-tight">Analytics</h1>
        <p className="text-[10px] md:text-[11px] text-muted-foreground">Trading intelligence center</p>
      </div>

      <SectionHeader title="Section 1: Performance Scorecards" />
      <div className="stagger-fade-in grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        {perf ? (
          <>
            <KpiBlock label="Total P&L" value={formatPnl(perf.totalPnL)} isPnl />
            <KpiBlock label="Win Rate" value={totalTrades > 0 ? `${((wins / totalTrades) * 100).toFixed(1)}%` : '---'} />
            <KpiBlock label="Profit Factor" value={perf.profitFactor === -1 ? '∞' : perf.profitFactor.toFixed(2)} />
            <KpiBlock label="Expectancy" value={formatPnl(perf.expectancy)} isPnl />
            <KpiBlock label="Max Drawdown" value={formatPnl(-perf.maxDrawdown)} isPnl />
            <KpiBlock label="Recovery Factor" value={recoveryFactor} />
            <KpiBlock label="Total Trades" value={String(perf.totalTrades)} />
            <KpiBlock label="Avg Win" value={avgWin} isPnl />
            <KpiBlock label="Avg Loss" value={avgLoss} isPnl />
            <KpiBlock label="Avg Risk:Reward" value={avgRrr} />
            <KpiBlock label="Gross Profit" value={grossProfitStr} isPnl />
            <KpiBlock label="Gross Loss" value={grossLossStr} isPnl />
          </>
        ) : (
          Array.from({ length: 12 }).map((_, i) => <KpiCardSkeleton key={i} />)
        )}
      </div>

      <div className="h-px bg-border/50" />

      <SectionHeader title="Section 2: Charts" />
      <div className="grid gap-4 md:gap-5 lg:grid-cols-2">
        <ChartCard title="Equity Curve">
          {perf ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={perf.equityCurve}>
                <defs>
                  <linearGradient id="eqGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.2} />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} tickFormatter={(v) => v.split('T')[0]} />
                <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} domain={[dataMin => Math.floor(dataMin * 0.998), dataMax => Math.ceil(dataMax * 1.002)]} tickFormatter={(v) => v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`} />
                <Tooltip labelFormatter={(l) => new Date(l).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' })} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 2, fontSize: 11 }} cursor={{ stroke: 'hsl(var(--muted-foreground))', fill: 'hsl(var(--muted-foreground))', fillOpacity: 0.08, strokeWidth: 1 }} formatter={(v) => { const n = Number(v); return [<span key="val" className={n >= 0 ? 'text-success' : 'text-destructive'}>{`$${n.toLocaleString()}`}</span>, 'Balance']; }} />
                <Area type="monotone" dataKey="balance" stroke="hsl(var(--success))" fill="url(#eqGrad2)" strokeWidth={1.5} dot={{ r: 2, fill: 'hsl(var(--success))', stroke: 'none' }} />
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
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.2} />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 2, fontSize: 11 }} cursor={{ stroke: 'hsl(var(--muted-foreground))', fill: 'hsl(var(--muted-foreground))', fillOpacity: 0.08, strokeWidth: 1 }} formatter={(v) => { const n = Number(v); return [<span key="val" className={n >= 0 ? 'text-success' : 'text-destructive'}>{formatPnl(n)}</span>, 'P&L']; }} />
                <Bar dataKey="pnl" radius={[1, 1, 0, 0]} maxBarSize={20}>
                  {pnlData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.pnl >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-[250px] flex items-center justify-center text-xs text-muted-foreground">Loading...</div>}
        </ChartCard>
      </div>

      <div className="h-px bg-border/50" />

      <SectionHeader title="Section 3: Trading Behavior" />
      <div className="grid gap-4 md:gap-5 lg:grid-cols-2">
        <ChartCard title="Time Analysis">
          <div className="mb-2 flex gap-1">
            {(['pnl', 'winrate'] as const).map((v) => (
              <button key={v} onClick={() => setTimeView(v)} className={cn('rounded-sm px-2 py-1 text-[10px] font-medium transition-colors', timeView === v ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80')}>
                {v === 'pnl' ? 'P&L by Hour' : 'Win Rate by Hour'}
              </button>
            ))}
          </div>
          {behav ? (
            timeView === 'pnl' ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={behav.hourly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.2} />
                  <XAxis dataKey="hour" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 2, fontSize: 11 }} cursor={{ stroke: 'hsl(var(--muted-foreground))', fill: 'hsl(var(--muted-foreground))', fillOpacity: 0.08, strokeWidth: 1 }} formatter={(v) => { const n = Number(v); return [<span key="val" className={n >= 0 ? 'text-success' : 'text-destructive'}>{formatPnl(n)}</span>, 'P&L']; }} />
                  <Bar dataKey="pnl" radius={[1, 1, 0, 0]} maxBarSize={16}>
                    {behav.hourly.map((entry, idx) => (
                      <Cell key={idx} fill={entry.pnl >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={behav.hourly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.2} />
                  <XAxis dataKey="hour" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 2, fontSize: 11 }} cursor={{ stroke: 'hsl(var(--muted-foreground))', fill: 'hsl(var(--muted-foreground))', fillOpacity: 0.08, strokeWidth: 1 }} formatter={(v) => { const n = Number(v); return [<span key="val" className={n >= 50 ? 'text-success' : 'text-destructive'}>{`${n}%`}</span>, 'Win Rate']; }} />
                  <Bar dataKey="winRate" radius={[1, 1, 0, 0]} maxBarSize={16}>
                    {behav.hourly.map((entry, idx) => (
                      <Cell key={idx} fill={entry.winRate >= 50 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )
          ) : <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">Loading...</div>}
          {behav && bestHour && worstHour && (
            <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
              <div className="rounded-sm bg-success/5 border border-success/10 p-1.5">
                <span className="text-muted-foreground">Best Hour: </span>
                <span className="font-medium text-success">{bestHour.hour}:00</span>
                <span className="text-muted-foreground"> ({formatPnl(bestHour.pnl)})</span>
              </div>
              <div className="rounded-sm bg-destructive/5 border border-destructive/10 p-1.5">
                <span className="text-muted-foreground">Worst Hour: </span>
                <span className="font-medium text-destructive">{worstHour.hour}:00</span>
                <span className="text-muted-foreground"> ({formatPnl(worstHour.pnl)})</span>
              </div>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Day Analysis">
          {behav ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={behav.weekday}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.2} />
                  <XAxis dataKey="day" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 2, fontSize: 11 }} cursor={{ stroke: 'hsl(var(--muted-foreground))', fill: 'hsl(var(--muted-foreground))', fillOpacity: 0.08, strokeWidth: 1 }} formatter={(v) => { const n = Number(v); return [<span key="val" className={n >= 0 ? 'text-success' : 'text-destructive'}>{formatPnl(n)}</span>, 'P&L']; }} />
                  <Bar dataKey="pnl" radius={[1, 1, 0, 0]} maxBarSize={24}>
                    {behav.weekday.map((entry, idx) => (
                      <Cell key={idx} fill={entry.pnl >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {bestWeekday && worstWeekday && (
                <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
                  <div className="rounded-sm bg-success/5 border border-success/10 p-1.5">
                    <span className="text-muted-foreground">Best Day: </span>
                    <span className="font-medium text-success">{bestWeekday.day}</span>
                    <span className="text-muted-foreground"> ({formatPnl(bestWeekday.pnl)}, {bestWeekday.winRate}% WR)</span>
                  </div>
                  <div className="rounded-sm bg-destructive/5 border border-destructive/10 p-1.5">
                    <span className="text-muted-foreground">Worst Day: </span>
                    <span className="font-medium text-destructive">{worstWeekday.day}</span>
                    <span className="text-muted-foreground"> ({formatPnl(worstWeekday.pnl)}, {worstWeekday.winRate}% WR)</span>
                  </div>
                </div>
              )}
            </>
          ) : <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">Loading...</div>}
        </ChartCard>

        <ChartCard title="Direction Analysis">
          {behav ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  { name: 'Long', pnl: behav.direction.long.pnl, trades: behav.direction.long.trades, wr: behav.direction.long.winRate },
                  { name: 'Short', pnl: behav.direction.short.pnl, trades: behav.direction.short.trades, wr: behav.direction.short.winRate },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 2, fontSize: 11 }} cursor={{ stroke: 'hsl(var(--muted-foreground))', fill: 'hsl(var(--muted-foreground))', fillOpacity: 0.08, strokeWidth: 1 }} formatter={(v) => { const n = Number(v); return [<span key="val" className={n >= 0 ? 'text-success' : 'text-destructive'}>{formatPnl(n)}</span>, 'P&L']; }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="pnl" radius={[1, 1, 0, 0]} maxBarSize={40} name="P&L">
                    {[
                      { name: 'Long', pnl: behav.direction.long.pnl },
                      { name: 'Short', pnl: behav.direction.short.pnl },
                    ].map((entry, idx) => (
                      <Cell key={idx} fill={entry.pnl >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} />
                    ))}
                  </Bar>
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
          ) : <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground">Loading...</div>}
        </ChartCard>

        <ChartCard title="Duration Analysis">
          {behav ? (
            <div className="space-y-3">
              <div className="rounded-sm bg-muted/50 p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Average Holding Time</p>
                <p className="text-xl md:text-2xl font-bold tabular-nums mt-1">{formatMinutes(behav.duration.avgHolding)}</p>
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
          ) : <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground">Loading...</div>}
        </ChartCard>
      </div>

      <div className="h-px bg-border/50" />

      <SectionHeader title="Section 4: Risk & Day Metrics" />
      <div className="stagger-fade-in grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        <KpiBlock label="Max Drawdown" value={perf ? formatPnl(-perf.maxDrawdown) : '---'} isPnl />
        <KpiBlock label="Win Streak" value={perf ? String(perf.winStreak) : '---'} />
        <KpiBlock label="Lose Streak" value={perf ? String(perf.loseStreak) : '---'} />
        <KpiBlock label="Avg Quantity" value={behav ? behav.execution.avgQty.toFixed(1) : '---'} />
        <KpiBlock label="Profitable Days" value={profitableDaysPct !== '---' ? `${profitableDaysPct}%` : '---'} />
        <KpiBlock label="Avg Day P&L" value={avgDayPnl} isPnl />
        <KpiBlock label="Best Day" value={bestDayStr} isPnl />
        <KpiBlock label="Worst Day" value={worstDayStr} isPnl />
      </div>
    </div>
  );
}

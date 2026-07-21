import { useEffect, useState } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiGet } from '@/lib/api';
import { cn } from '@/lib/utils';
import { formatPnl, SectionHeader } from '@/design-system';
import { useSelectedAccount } from '@/contexts/SelectedAccountContext';
import type { ConsistencyData } from '@/types';

export default function Consistency() {
  const { selectedAccountId } = useSelectedAccount();
  const [data, setData] = useState<ConsistencyData | null>(null);
  const [threshold, setThreshold] = useState(30);
  const [profitTarget, setProfitTarget] = useState(() => {
    const saved = localStorage.getItem('consistencyProfitTarget');
    return saved ? Number(saved) : 0;
  });

  useEffect(() => {
    localStorage.setItem('consistencyProfitTarget', String(profitTarget));
  }, [profitTarget]);

  const acctParam = selectedAccountId ? `&accountId=${selectedAccountId}` : '';

  useEffect(() => {
    apiGet<ConsistencyData>(`/analytics/consistency?t=${Date.now()}${acctParam}`).then(setData).catch(() => {});
  }, [acctParam]);

  const bestDay = data?.bestDay ?? null;
  const ratio = profitTarget > 0 && bestDay
    ? Math.round((bestDay.pnl / profitTarget) * 10000) / 100
    : data?.consistencyRatio ?? 0;
  const pass = ratio <= threshold;

  return (
    <div className="space-y-4 md:space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base md:text-lg font-semibold tracking-tight">Consistency Rule</h1>
          <p className="text-[10px] md:text-[11px] text-muted-foreground">Prop firm profit distribution analysis</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-2 rounded-lg border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] px-3 py-1.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Threshold</span>
          <span className="text-xs font-bold tabular-nums">{threshold}%</span>
          <input type="range" min={15} max={50} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="w-24 h-1 accent-primary cursor-pointer" />
        </div>
        <div className="inline-flex items-center gap-2 rounded-lg border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] px-3 py-1.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Profit Target</span>
          <span className="text-xs font-bold tabular-nums">${profitTarget.toLocaleString()}</span>
          <input type="number" min={0} step={100} value={profitTarget || ''} onChange={(e) => setProfitTarget(Number(e.target.value) || 0)} className="w-20 text-right text-xs bg-transparent border border-[hsl(var(--tv-border))] rounded px-1.5 py-0.5 tabular-nums outline-none focus:border-primary" placeholder="0" />
        </div>
      </div>

      {data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
            <StatusCard label="Best Day" value={bestDay ? formatPnl(bestDay.pnl) : '---'} date={bestDay?.date} isPnl />
            <StatusCard label="Profit Target" value={`$${profitTarget.toLocaleString()}`} subtitle={profitTarget > 0 ? `Target: ${profitTarget.toLocaleString()}` : 'Not set'} />
            <StatusCard label="Consistency Ratio" value={`${ratio}%`} status={pass ? 'pass' : 'fail'} subtitle={profitTarget > 0 ? `Limit: ${threshold}% of target` : `Limit: ${threshold}% of net profit`} />
            <StatusCard label="Trading Days" value={String(data.tradingDays)} />
          </div>

          {profitTarget > 0 && (
            <div className="rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-3 md:p-4 card-hover">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Best Day vs Profit Target</p>
                  <p className="text-lg md:text-xl font-bold tabular-nums mt-1">{ratio}%</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Your best day (${bestDay?.pnl.toLocaleString() ?? 0}) is {ratio}% of your ${profitTarget.toLocaleString()} target
                  </p>
                </div>
                <span className={cn('text-xs font-bold', pass ? 'text-success' : 'text-destructive')}>
                  {pass ? '✓ Within Limit' : '✗ Exceeds Limit'}
                </span>
              </div>
            </div>
          )}

          {/* Gauge / progress bar */}
          <div className="rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-3 md:p-4 card-hover">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {profitTarget > 0 ? 'Best Day % of Profit Target' : 'Best Day % of Total Net Profit'}
              </p>
              <span className={cn('text-xs font-bold tabular-nums', pass ? 'text-success' : 'text-destructive')}>
                {ratio}% {pass ? '✓' : '✗'}
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(ratio, 100)}%`, background: pass ? 'hsl(var(--success))' : 'hsl(var(--destructive))' }} />
            </div>
            <div className="relative h-4 mt-0.5">
              <div className="absolute top-0 w-px h-3 bg-foreground/60" style={{ left: `${threshold}%` }} />
              <span className="absolute text-[9px] text-muted-foreground -translate-x-1/2" style={{ left: `${threshold}%`, top: '4px' }}>{threshold}% limit</span>
            </div>
          </div>

          {/* What's needed to pass */}
          {profitTarget > 0 && !pass && bestDay && (
            <div className="rounded border border-amber-500/20 bg-amber-500/5 p-3 md:p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Needed to Pass</p>
              <p className="text-sm font-medium">Your best day (${bestDay.pnl.toLocaleString()}) exceeds {threshold}% of your ${profitTarget.toLocaleString()} profit target.</p>
              <p className="text-sm font-medium mt-1">Max allowed best day: <span className="font-bold tabular-nums">${(profitTarget * threshold / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
              <p className="text-sm font-medium">Reduce best day by: <span className="font-bold tabular-nums text-destructive">${(bestDay.pnl - profitTarget * threshold / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
            </div>
          )}

          {profitTarget <= 0 && data.consistencyRatio > threshold && bestDay && (
            <div className="rounded border border-amber-500/20 bg-amber-500/5 p-3 md:p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Needed to Pass (based on total net profit)</p>
              <p className="text-sm font-medium">Your best day (${bestDay.pnl.toLocaleString()}) exceeds {threshold}% of total profit.</p>
              <p className="text-sm font-medium mt-1">Target total profit: <span className="font-bold tabular-nums">${(bestDay.pnl / (threshold / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
              <p className="text-sm font-medium">Additional profit needed: <span className="font-bold tabular-nums text-success">${(bestDay.pnl / (threshold / 100) - data.totalNetProfit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
            </div>
          )}

          <SectionHeader title="Daily P&L Distribution" />
          <div className="rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-3 md:p-4 card-hover">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.dailyPnl}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.2} />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 2, fontSize: 11 }} cursor={{ stroke: 'hsl(var(--muted-foreground))', fill: 'hsl(var(--muted-foreground))', fillOpacity: 0.08, strokeWidth: 1 }} formatter={(v) => { const n = Number(v); return [<span key="val" className={n >= 0 ? 'text-success' : 'text-destructive'}>{formatPnl(n)}</span>, 'P&L']; }} />
                <Bar dataKey="pnl" radius={[1, 1, 0, 0]} maxBarSize={24}>
                  {data.dailyPnl.map((entry, idx) => (
                    <Cell key={idx} fill={entry.pnl >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <SectionHeader title="Day-by-Day Breakdown" />
          <div className="rounded border border-[hsl(var(--tv-border))] overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/30">
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Date</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">P&L</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">% of Total</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Best Day?</th>
                </tr>
              </thead>
              <tbody>
                {data.dailyPnl.map((d) => (
                  <tr key={d.date} className={cn('border-t border-border/40', d.pnl > 0 && bestDay && d.date === bestDay.date ? 'bg-amber-500/5' : '')}>
                    <td className="px-3 py-2 font-medium">{new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' })}</td>
                    <td className={cn('px-3 py-2 text-right font-bold tabular-nums', d.pnl >= 0 ? 'text-success' : 'text-destructive')}>{formatPnl(d.pnl)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{data.totalNetProfit > 0 ? `${Math.round((d.pnl / data.totalNetProfit) * 10000) / 100}%` : '---'}</td>
                    <td className="px-3 py-2 text-right">{bestDay && d.date === bestDay.date ? <span className="text-xs text-amber-500 font-medium">★ Best</span> : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-40 text-xs text-muted-foreground">Loading...</div>
      )}
    </div>
  );
}

function StatusCard({ label, value, date, isPnl, status, subtitle }: { label: string; value: string; date?: string; isPnl?: boolean; status?: 'pass' | 'fail'; subtitle?: string }) {
  const negative = isPnl && value.startsWith('-');
  const statusColor = status === 'pass' ? 'text-success' : status === 'fail' ? 'text-destructive' : '';
  return (
    <div className="rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-3 card-hover">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn('text-lg md:text-xl font-bold tabular-nums mt-1', statusColor || (isPnl && (negative ? 'text-destructive' : 'text-success')))}>{value}</p>
      {date && <p className="text-[9px] text-muted-foreground mt-0.5">{new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' })}</p>}
      {subtitle && <p className="text-[9px] text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
  );
}

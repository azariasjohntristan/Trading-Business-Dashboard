import { useEffect, useState, useCallback } from 'react';
import { apiGet } from '@/lib/api';
import { cn } from '@/lib/utils';
import { KpiCard, TradingCalendar, StatusBadge, formatPnl } from '@/design-system';
import type { KpiData, CalendarDay, DayDetail, Trade } from '@/types';

function DayDetailPanel({ date, detail }: { date: string; detail: DayDetail | null }) {
  if (!detail) return null;

  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">{date}</span>
        <div className="flex items-center gap-3 text-[11px]">
          <span className={detail.totalPnl >= 0 ? 'text-success' : 'text-destructive'}>
            {formatPnl(detail.totalPnl)}
          </span>
          <span className="text-muted-foreground">{detail.totalTrades} trade{detail.totalTrades !== 1 ? 's' : ''}</span>
          <span className="text-muted-foreground">{detail.winRate}% WR</span>
        </div>
      </div>
      <div className="space-y-px">
        {detail.trades.map((t) => (
          <div key={t.id} className="flex items-center justify-between rounded-sm bg-muted/30 px-2 py-1 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{t.symbol}</span>
              <StatusBadge variant={t.direction === 'LONG' ? 'long' : 'short'}>{t.direction}</StatusBadge>
            </div>
            <span className={Number(t.pnl) >= 0 ? 'text-success' : 'text-destructive'}>
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

  const fetchKpi = useCallback(() => {
    apiGet<KpiData>('/dashboard/kpi').then(setKpi).catch(() => {});
  }, []);

  const fetchCalendar = useCallback(() => {
    apiGet<CalendarDay[]>('/dashboard/calendar').then(setCalendarDays).catch(() => {});
  }, []);

  const fetchRecentTrades = useCallback(() => {
    apiGet<Trade[]>('/trades/recent').then(setRecentTrades).catch(() => {});
  }, []);

  useEffect(() => {
    fetchKpi();
    fetchCalendar();
    fetchRecentTrades();
  }, [fetchKpi, fetchCalendar, fetchRecentTrades]);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    apiGet<DayDetail>(`/dashboard/calendar/${date}`).then(setDayDetail).catch(() => {});
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Dashboard</h1>
          <p className="text-xs text-muted-foreground">Your trading command center</p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
          {kpi !== null ? 'DB Online' : 'Connecting...'}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Today P&L" value={kpi ? formatPnl(kpi.todayPnl) : '---'} isCurrency trend={kpi && kpi.todayPnl > 0 ? 'up' : kpi && kpi.todayPnl < 0 ? 'down' : undefined} subtitle={`${kpi?.todayTrades ?? 0} trades`} />
        <KpiCard label="Week P&L" value={kpi ? formatPnl(kpi.weekPnl) : '---'} isCurrency trend={kpi && kpi.weekPnl > 0 ? 'up' : kpi && kpi.weekPnl < 0 ? 'down' : undefined} subtitle={`${kpi?.weekTrades ?? 0} trades`} />
        <KpiCard label="Month P&L" value={kpi ? formatPnl(kpi.monthPnl) : '---'} isCurrency trend={kpi && kpi.monthPnl > 0 ? 'up' : kpi && kpi.monthPnl < 0 ? 'down' : undefined} subtitle={`${kpi?.monthTrades ?? 0} trades`} />
        <KpiCard label="Total P&L" value={kpi ? formatPnl(kpi.totalPnl) : '---'} isCurrency trend={kpi && kpi.totalPnl > 0 ? 'up' : kpi && kpi.totalPnl < 0 ? 'down' : undefined} subtitle={`${kpi?.totalTrades ?? 0} trades`} />
        <KpiCard label="Win Rate" value={kpi ? `${kpi.winRate}%` : '---'} trend={kpi && kpi.winRate >= 50 ? 'up' : kpi && kpi.winRate < 50 ? 'down' : undefined} />
        <KpiCard label="Profit Factor" value={kpi ? (kpi.profitFactor === -1 ? '∞' : String(kpi.profitFactor)) : '---'} />
        <KpiCard label="Total Trades" value={kpi ? String(kpi.totalTrades) : '---'} />
        <KpiCard label="System" value={kpi !== null ? 'Online' : 'Check'} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">P&L Calendar</h2>
          <TradingCalendar days={calendarDays} selectedDate={selectedDate} onSelect={handleDateSelect} />
          {selectedDate && dayDetail && (
            <div className="mt-2">
              <DayDetailPanel date={selectedDate} detail={dayDetail} />
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent Trades</h2>
          {recentTrades.length === 0 ? (
            <p className="text-sm text-muted-foreground">No trades yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Symbol</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Direction</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Qty</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">P&L</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Date</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTrades.map((t) => (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-3 py-2 font-medium">{t.symbol}</td>
                      <td className="px-3 py-2">
                        <StatusBadge variant={t.direction === 'LONG' ? 'long' : 'short'}>{t.direction}</StatusBadge>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{Number(t.qty).toFixed(2)}</td>
                      <td className={cn('px-3 py-2 text-right font-medium tabular-nums', Number(t.pnl) >= 0 ? 'text-success' : 'text-destructive')}>
                        {formatPnl(Number(t.pnl))}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {new Date(t.soldTimestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{t.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

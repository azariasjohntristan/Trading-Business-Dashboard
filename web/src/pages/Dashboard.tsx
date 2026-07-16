import { useEffect, useState, useCallback } from 'react';
import { apiGet } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { KpiData, CalendarDay, DayDetail, Trade } from '@/types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatPnl(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', signDisplay: 'always' }).format(value);
}

function KpiCard({ label, value, isCurrency }: { label: string; value: string; isCurrency?: boolean }) {
  const isNegative = isCurrency && value.startsWith('-');
  return (
    <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className={cn('text-2xl font-bold', isCurrency && (isNegative ? 'text-destructive' : 'text-success'))}>
        {value}
      </p>
    </div>
  );
}

function CalendarGrid({
  days,
  selectedDate,
  onSelect,
}: {
  days: CalendarDay[];
  selectedDate: string | null;
  onSelect: (date: string) => void;
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const pnlMap = new Map<string, CalendarDay>();
  days.forEach((d) => pnlMap.set(d.date, d));

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); }}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr;
        </button>
        <span className="text-sm font-medium">{MONTHS[month]} {year}</span>
        <button
          onClick={() => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); }}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &rarr;
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayData = pnlMap.get(dateStr);
          const isSelected = selectedDate === dateStr;
          const isToday = dateStr === today.toISOString().split('T')[0];

          return (
            <button
              key={dateStr}
              onClick={() => onSelect(dateStr)}
              className={cn(
                'rounded p-1 text-xs transition-colors',
                dayData
                  ? dayData.pnl >= 0 ? 'bg-success/20 hover:bg-success/30' : 'bg-destructive/20 hover:bg-destructive/30'
                  : 'hover:bg-muted',
                isSelected && 'ring-2 ring-primary',
                isToday && 'font-bold',
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DayDetailPanel({ date, detail }: { date: string; detail: DayDetail | null }) {
  if (!detail) return null;

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-2 text-sm font-semibold">{date}</h3>
      <div className="mb-3 grid grid-cols-3 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">P&L: </span>
          <span className={detail.totalPnl >= 0 ? 'text-success' : 'text-destructive'}>
            {formatPnl(detail.totalPnl)}
          </span>
        </div>
        <div><span className="text-muted-foreground">Trades: </span>{detail.totalTrades}</div>
        <div><span className="text-muted-foreground">Win Rate: </span>{detail.winRate}%</div>
      </div>
      <div className="space-y-1">
        {detail.trades.map((t) => (
          <div key={t.id} className="flex items-center justify-between rounded bg-muted/50 px-2 py-1 text-xs">
            <span className="font-medium">{t.symbol}</span>
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Your trading command center</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Today's P&L" value={kpi ? formatPnl(kpi.todayPnl) : '---'} isCurrency />
        <KpiCard label="This Week" value={kpi ? formatPnl(kpi.weekPnl) : '---'} isCurrency />
        <KpiCard label="This Month" value={kpi ? formatPnl(kpi.monthPnl) : '---'} isCurrency />
        <KpiCard label="Total P&L" value={kpi ? formatPnl(kpi.totalPnl) : '---'} isCurrency />
        <KpiCard label="Win Rate" value={kpi ? `${kpi.winRate}%` : '---'} />
        <KpiCard label="Profit Factor" value={kpi ? (kpi.profitFactor === -1 ? '∞' : String(kpi.profitFactor)) : '---'} />
        <KpiCard label="Total Trades" value={kpi ? String(kpi.totalTrades) : '---'} />
        <KpiCard
          label="System"
          value={kpi !== null ? 'DB Online' : 'Checking...'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <h2 className="mb-3 text-lg font-semibold">P&L Calendar</h2>
          <CalendarGrid days={calendarDays} selectedDate={selectedDate} onSelect={handleDateSelect} />
          {selectedDate && dayDetail && (
            <div className="mt-3">
              <DayDetailPanel date={selectedDate} detail={dayDetail} />
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <h2 className="mb-3 text-lg font-semibold">Recent Trades</h2>
          {recentTrades.length === 0 ? (
            <p className="text-sm text-muted-foreground">No trades yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-2 text-left font-medium">Symbol</th>
                    <th className="px-3 py-2 text-left font-medium">Direction</th>
                    <th className="px-3 py-2 text-right font-medium">Qty</th>
                    <th className="px-3 py-2 text-right font-medium">P&L</th>
                    <th className="px-3 py-2 text-left font-medium">Date</th>
                    <th className="px-3 py-2 text-left font-medium">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTrades.map((t) => (
                    <tr key={t.id} className="border-b last:border-0">
                      <td className="px-3 py-2 font-medium">{t.symbol}</td>
                      <td className="px-3 py-2">
                        <span className={cn(
                          'inline-block rounded px-1.5 py-0.5 text-xs font-medium',
                          t.direction === 'LONG' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive',
                        )}>
                          {t.direction}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">{Number(t.qty).toFixed(2)}</td>
                      <td className={cn('px-3 py-2 text-right font-medium', Number(t.pnl) >= 0 ? 'text-success' : 'text-destructive')}>
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

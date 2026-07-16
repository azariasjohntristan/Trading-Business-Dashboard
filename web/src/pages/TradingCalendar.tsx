import { useEffect, useState, useCallback } from 'react';
import { apiGet } from '@/lib/api';
import { cn } from '@/lib/utils';
import { TradingCalendar, TradeCard, StatusBadge, SectionHeader, formatPnl } from '@/design-system';
import type { CalendarDay, DayDetail } from '@/types';

export default function TradingCalendarPage() {
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayDetail, setDayDetail] = useState<DayDetail | null>(null);

  const fetchCalendar = useCallback(() => {
    apiGet<CalendarDay[]>('/dashboard/calendar').then(setCalendarDays).catch(() => {});
  }, []);

  useEffect(() => { fetchCalendar(); }, [fetchCalendar]);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    apiGet<DayDetail>(`/dashboard/calendar/${date}`).then(setDayDetail).catch(() => {});
  };

  const sorted = dayDetail ? [...dayDetail.trades].sort((a, b) => Number(b.pnl) - Number(a.pnl)) : [];
  const best = sorted.find(t => Number(t.pnl) >= 0) ?? null;
  const worst = sorted.find(t => Number(t.pnl) < 0) ?? null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-base font-semibold tracking-tight">Trading Calendar</h1>
        <p className="text-[11px] text-muted-foreground">TradeZella-style daily review</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <SectionHeader title="Calendar" subtitle="Click a day to review trades" />
          <div className="mt-2">
            <TradingCalendar days={calendarDays} selectedDate={selectedDate} onSelect={handleDateSelect} showDetails />
          </div>
        </div>

        <div className="lg:col-span-2 space-y-3">
          {selectedDate ? (
            dayDetail ? (
              <>
                <div className="rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-3 animate-fade-in">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold">{selectedDate}</span>
                    <div className="flex items-center gap-4 text-xs">
                      <span className={dayDetail.totalPnl >= 0 ? 'text-success' : 'text-destructive'}>{formatPnl(dayDetail.totalPnl)}</span>
                      <span className="text-muted-foreground">{dayDetail.totalTrades} trades</span>
                      <span className="text-muted-foreground">{dayDetail.winRate}% win rate</span>
                    </div>
                  </div>
                  {best && worst && (
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="rounded-sm bg-success/5 border border-success/10 p-2.5">
                        <p className="text-[9px] uppercase tracking-wider text-success mb-1">Best Trade</p>
                        <p className="text-sm font-semibold text-success">{best.symbol}</p>
                        <div className="flex items-center gap-2 text-[10px] text-success/80 mt-1">
                          <StatusBadge variant={best.direction === 'LONG' ? 'long' : 'win'}>{best.direction}</StatusBadge>
                          <span>{formatPnl(Number(best.pnl))}</span>
                        </div>
                      </div>
                      <div className="rounded-sm bg-destructive/5 border border-destructive/10 p-2.5">
                        <p className="text-[9px] uppercase tracking-wider text-destructive mb-1">Worst Trade</p>
                        <p className="text-sm font-semibold text-destructive">{worst.symbol}</p>
                        <div className="flex items-center gap-2 text-[10px] text-destructive/80 mt-1">
                          <StatusBadge variant={worst.direction === 'SHORT' ? 'short' : 'loss'}>{worst.direction}</StatusBadge>
                          <span>{formatPnl(Number(worst.pnl))}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <SectionHeader title="Trades" subtitle={`${dayDetail.trades.length} trades on ${selectedDate}`} />
                <div className="grid gap-2">
                  {sorted.map((t) => (
                    <TradeCard key={t.id} trade={t} />
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-64 text-xs text-muted-foreground">Loading day details...</div>
            )
          ) : (
            <div className="flex items-center justify-center h-64 rounded border border-dashed border-[hsl(var(--tv-border))]">
              <p className="text-xs text-muted-foreground">Select a day from the calendar to review trades</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

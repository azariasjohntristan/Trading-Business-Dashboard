import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { CalendarDay } from '@/types';
import { formatPnl } from './format';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface TradingCalendarProps {
  days: CalendarDay[];
  selectedDate: string | null;
  onSelect: (date: string) => void;
}

export function TradingCalendar({ days, selectedDate, onSelect }: TradingCalendarProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const pnlMap = new Map(days.map((d) => [d.date, d]));

  const prev = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  };
  const next = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  };

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <button onClick={prev} className="text-xs text-muted-foreground hover:text-foreground">&larr;</button>
        <span className="text-xs font-semibold tracking-tight text-muted-foreground">{MONTHS[month]} {year}</span>
        <button onClick={next} className="text-xs text-muted-foreground hover:text-foreground">&rarr;</button>
      </div>
      <div className="grid grid-cols-7 gap-px text-center text-[11px]">
        {DAYS.map((d) => (
          <div key={d} className="py-1 text-muted-foreground/60">{d}</div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`e-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dd = pnlMap.get(dateStr);
          const isSelected = selectedDate === dateStr;
          const isToday = dateStr === today.toISOString().split('T')[0];

          return (
            <button
              key={dateStr}
              onClick={() => onSelect(dateStr)}
              className={cn(
                'relative rounded p-1 text-xs transition-all',
                dd ? (dd.pnl >= 0 ? 'bg-success/15 hover:bg-success/25' : 'bg-destructive/15 hover:bg-destructive/25') : 'hover:bg-muted',
                isSelected && 'ring-1 ring-primary',
                isToday && 'font-bold',
              )}
            >
              {day}
              {dd && (
                <span className={cn(
                  'mt-px block text-[9px] leading-none',
                  dd.pnl >= 0 ? 'text-success' : 'text-destructive',
                )}>
                  {formatPnl(dd.pnl)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

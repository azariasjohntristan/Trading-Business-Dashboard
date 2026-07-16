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
  showDetails?: boolean;
}

export function TradingCalendar({ days, selectedDate, onSelect, showDetails = true }: TradingCalendarProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const pnlMap = new Map(days.map((d) => [d.date, d]));

  const prev = () => { if (month === 0) { setYear((y) => y - 1); setMonth(11); } else setMonth((m) => m - 1); };
  const next = () => { if (month === 11) { setYear((y) => y + 1); setMonth(0); } else setMonth((m) => m + 1); };

  return (
    <div className="rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-3 animate-fade-in">
      <div className="mb-3 flex items-center justify-between">
        <button onClick={prev} className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors">&larr;</button>
        <span className="text-xs font-semibold text-muted-foreground">{MONTHS[month]} {year}</span>
        <button onClick={next} className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors">&rarr;</button>
      </div>
      <div className="grid grid-cols-7 gap-px">
        {DAYS.map((d) => (
          <div key={d} className="py-1 text-center text-[10px] font-medium text-muted-foreground/50">{d}</div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
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
                'relative flex flex-col items-center rounded-sm p-1.5 text-xs transition-all',
                dd ? (
                  dd.pnl >= 0
                    ? 'bg-success/10 hover:bg-success/20'
                    : 'bg-destructive/10 hover:bg-destructive/20'
                ) : 'hover:bg-muted',
                isSelected && 'ring-1 ring-primary',
                isToday && 'font-bold',
              )}
            >
              <span className={cn('text-xs', isToday && 'text-primary')}>{day}</span>
              {dd && showDetails && (
                <>
                  <span className={cn(
                    'text-[9px] leading-tight font-medium',
                    dd.pnl >= 0 ? 'text-success' : 'text-destructive',
                  )}>
                    {dd.pnl >= 0 ? '+' : ''}{formatPnl(dd.pnl)}
                  </span>
                  <span className="text-[8px] text-muted-foreground/60">{dd.trades} trades</span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

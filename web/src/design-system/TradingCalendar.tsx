import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { CalendarDay } from '@/types';
import { formatPnl } from './format';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
    <div className="rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-3 md:p-4 animate-fade-in">
      <div className="mb-3 flex items-center justify-between">
        <button onClick={prev} className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-muted-foreground">{MONTHS[month]} {year}</span>
        <button onClick={next} className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 md:gap-1.5">
        {DAYS.map((d) => (
          <div key={d} className="py-1 text-center text-[10px] md:text-[11px] font-medium text-muted-foreground/50">{d}</div>
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
                'flex flex-col items-center justify-center rounded-md p-1.5 md:p-2 text-xs transition-all duration-150 min-h-[52px] md:min-h-[64px]',
                dd ? (
                  dd.pnl >= 0
                    ? 'bg-success/8 hover:bg-success/15 border border-success/15'
                    : 'bg-destructive/8 hover:bg-destructive/15 border border-destructive/15'
                ) : 'hover:bg-muted/50 border border-transparent',
                isSelected && 'ring-1 ring-primary',
                isToday && 'ring-1 ring-primary/50',
              )}
            >
              <span className={cn('text-xs md:text-sm font-semibold leading-tight', isToday && 'text-primary')}>{day}</span>
              {dd && showDetails && (
                <>
                  <span className={cn(
                    'text-[9px] md:text-[10px] leading-tight font-medium mt-0.5',
                    dd.pnl >= 0 ? 'text-success' : 'text-destructive',
                  )}>
                    {dd.pnl >= 0 ? '+' : ''}{formatPnl(dd.pnl)}
                  </span>
                  <span className="text-[8px] md:text-[9px] text-muted-foreground/60 leading-tight">{dd.trades} trades</span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

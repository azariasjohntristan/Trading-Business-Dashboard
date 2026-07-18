import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { CalendarDay } from '@/types';
import { formatPnl } from './format';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface TradingCalendarProps {
  days: CalendarDay[];
  selectedDate: string | null;
  onSelect: (date: string) => void;
  showDetails?: boolean;
  month?: number;
  year?: number;
  onMonthChange?: (year: number, month: number) => void;
}

export function TradingCalendar({ days, selectedDate, onSelect, showDetails = true, month: controlledMonth, year: controlledYear, onMonthChange }: TradingCalendarProps) {
  const today = new Date();
  const [internalYear, setInternalYear] = useState(today.getFullYear());
  const [internalMonth, setInternalMonth] = useState(today.getMonth());

  const year = controlledYear ?? internalYear;
  const month = controlledMonth ?? internalMonth;

  const goTo = (y: number, m: number) => {
    if (!controlledYear) setInternalYear(y);
    if (!controlledMonth) setInternalMonth(m);
    onMonthChange?.(y, m);
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const pnlMap = new Map(days.map((d) => [d.date, d]));

  const prev = () => { if (month === 0) goTo(year - 1, 11); else goTo(year, month - 1); };
  const next = () => { if (month === 11) goTo(year + 1, 0); else goTo(year, month + 1); };

  const gridStart = new Date(year, month, 1);
  gridStart.setDate(gridStart.getDate() - firstDay);
  const numWeeks = Math.ceil((firstDay + daysInMonth) / 7);

  const weekRows: { dayNum: number; dateStr: string; isOverlap: boolean }[][] = [];
  for (let w = 0; w < numWeeks; w++) {
    const row: { dayNum: number; dateStr: string; isOverlap: boolean }[] = [];
    for (let d = 0; d < 7; d++) {
      const cellDate = new Date(gridStart);
      cellDate.setDate(gridStart.getDate() + w * 7 + d);
      row.push({
        dayNum: cellDate.getDate(),
        dateStr: `${cellDate.getFullYear()}-${String(cellDate.getMonth() + 1).padStart(2, '0')}-${String(cellDate.getDate()).padStart(2, '0')}`,
        isOverlap: cellDate.getMonth() !== month,
      });
    }
    weekRows.push(row);
  }

  return (
    <div className="rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-3 md:p-4 card-hover animate-fade-in">
      <div className="mb-3 flex h-7 items-center justify-between">
        <button onClick={prev} className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-muted-foreground">{MONTHS[month]} {year}</span>
        <button onClick={next} className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 md:gap-1.5 mb-1">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
          <div key={d} className="py-1 text-center text-[10px] md:text-[11px] font-medium text-muted-foreground/50">{d}</div>
        ))}
      </div>

      {weekRows.map((row, wi) => (
        <div key={wi} className="mb-1 last:mb-0">
          <div className="grid grid-cols-7 gap-1 md:gap-1.5">
            {row.map((cell) => {
              const dd = pnlMap.get(cell.dateStr);
              const isSelected = selectedDate === cell.dateStr;
              const isToday = cell.dateStr === today.toISOString().split('T')[0];

              return (
                <button
                  key={cell.dateStr}
                  onClick={() => onSelect(cell.dateStr)}
                  className={cn(
                    'flex flex-col items-center justify-center rounded-md p-1.5 md:p-2 text-xs transition-all duration-200 min-h-[68px] md:min-h-[80px] w-full',
                    cell.isOverlap
                      ? 'opacity-30 hover:opacity-60 border border-transparent'
                      : dd
                        ? dd.pnl >= 0
                          ? 'bg-success/8 hover:bg-success/15 border border-success/15 hover:shadow-[0_0_12px] hover:shadow-success/20'
                          : 'bg-destructive/8 hover:bg-destructive/15 border border-destructive/15 hover:shadow-[0_0_12px] hover:shadow-destructive/20'
                        : 'hover:bg-muted/50 border border-transparent',
                    isSelected && 'ring-1 ring-primary',
                    isToday && !cell.isOverlap && 'ring-1 ring-primary/50',
                  )}
                >
                  <span className={cn('text-xs md:text-sm font-semibold leading-tight', isToday && !cell.isOverlap && 'text-primary')}>{cell.dayNum}</span>
                  {dd && showDetails && (
                    <>
                      <span className={cn(
                        'text-[9px] md:text-[10px] leading-tight font-medium mt-0.5',
                        dd.pnl >= 0 ? 'text-success' : 'text-destructive',
                      )}>
                        {formatPnl(dd.pnl)}
                      </span>
                      <span className="text-[8px] md:text-[9px] text-muted-foreground/60 leading-tight">{dd.trades} trades</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

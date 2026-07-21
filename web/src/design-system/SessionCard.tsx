import { cn } from '@/lib/utils';
import { formatPnl } from './format';
import { getDayScreenshotLink } from '@/lib/dayScreenshot';
import { ChevronRight, Trash2 } from 'lucide-react';
import type { DailySession } from '@/types';

interface SessionCardProps {
  session: DailySession;
  onClick: () => void;
  selected?: boolean;
  onDelete?: () => void;
}

export function SessionCard({ session, onClick, selected, onDelete }: SessionCardProps) {
  const { date, totalPnl, totalTrades, winRate, bestTrade, worstTrade, avgWinner, avgLoser, avgHoldMinutes, firstTradeTime, lastTradeTime, screenshotStatus, trades } = session;
  const dayLink = getDayScreenshotLink(date);
  const ssStatus = dayLink ? 'complete' : screenshotStatus;
  const positive = totalPnl >= 0;
  const dayName = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' });
  const symbols = [...new Set(trades.map(t => t.symbol))].join(', ');
  const ssDot = ssStatus === 'complete' ? 'bg-success' : ssStatus === 'partial' ? 'bg-amber-500' : 'bg-muted-foreground';

  return (
    <tr
      onClick={onClick}
      className={cn(
        'group cursor-pointer border-b border-border/50 transition-colors hover:bg-muted/20',
        selected && 'bg-success/5'
      )}
    >
      <td className="py-3 px-3 text-center">
        <div className="inline-flex items-center gap-2">
          <span className={cn('h-2 w-2 rounded-full shrink-0', ssDot)} />
          <span className="text-xs font-medium text-foreground/80 whitespace-nowrap">{dayName}</span>
        </div>
      </td>
      <td className="py-3 px-3 text-center">
        <span className="text-xs text-muted-foreground">{symbols}</span>
      </td>
      <td className="py-3 px-3 text-center">
        <span className={cn('text-sm font-bold tabular-nums', positive ? 'text-success' : 'text-destructive')}>
          {formatPnl(totalPnl)}
        </span>
      </td>
      <td className="py-3 px-3 text-center">
        <span className="text-xs tabular-nums text-muted-foreground">{totalTrades}</span>
      </td>
      <td className="py-3 px-3 text-center">
        <span className={cn('text-xs font-medium tabular-nums', winRate >= 50 ? 'text-success' : 'text-destructive')}>{winRate}%</span>
      </td>
      <td className="py-3 px-3 text-center">
        <span className="text-xs tabular-nums text-muted-foreground">{avgHoldMinutes}m</span>
      </td>
      <td className="py-3 px-3 text-center">
        <div className="inline-flex items-center gap-2 text-xs">
          <span className="text-success tabular-nums font-medium">{bestTrade > 0 ? formatPnl(bestTrade) : '$0.00'}</span>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-destructive tabular-nums font-medium">{worstTrade < 0 ? formatPnl(worstTrade) : '$0.00'}</span>
        </div>
      </td>
      <td className="py-3 px-3 text-center">
        <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <span className="tabular-nums text-success font-medium">{avgWinner > 0 ? formatPnl(avgWinner) : '$0.00'}</span>
          <span className="text-muted-foreground/40">/</span>
          <span className="tabular-nums text-destructive font-medium">{avgLoser < 0 ? formatPnl(avgLoser) : '$0.00'}</span>
        </div>
      </td>
      <td className="py-3 px-3 text-center">
        <span className="text-xs tabular-nums text-muted-foreground">{firstTradeTime ?? '--'} – {lastTradeTime ?? '--'}</span>
      </td>
      <td className="py-3 px-3 text-center whitespace-nowrap">
        <div className="inline-flex items-center gap-1">
          <span className="inline-flex items-center gap-0.5 text-xs font-medium text-success opacity-0 group-hover:opacity-100 transition-opacity">
            Review <ChevronRight className="h-3 w-3" />
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
            className="opacity-0 group-hover:opacity-100 rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
            title="Delete all trades for this day"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

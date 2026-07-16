import { cn } from '@/lib/utils';
import { StatusBadge } from './StatusBadge';
import { formatPnl } from './format';
import { X } from 'lucide-react';
import type { DayDetail } from '@/types';

interface DailyReviewPanelProps {
  date: string;
  detail: DayDetail;
  onClose: () => void;
}

export function DailyReviewPanel({ date, detail, onClose }: DailyReviewPanelProps) {
  const sorted = [...detail.trades].sort((a, b) => Math.abs(Number(b.pnl)) - Math.abs(Number(a.pnl)));
  const best = sorted.find(t => Number(t.pnl) >= 0) ?? null;
  const worst = sorted.find(t => Number(t.pnl) < 0) ?? null;

  return (
    <div className="rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-3 md:p-4 animate-slide-in-right">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold">{date}</h3>
          <p className="text-[10px] text-muted-foreground">Trading Review</p>
        </div>
        <button onClick={onClose} className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="text-center mb-4 p-3 rounded-md bg-muted/30">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">P&L</p>
        <p className={cn('text-2xl font-bold tabular-nums', detail.totalPnl >= 0 ? 'text-success' : 'text-destructive')}>
          {formatPnl(detail.totalPnl)}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4 text-center text-[10px]">
        <div className="rounded bg-muted/30 p-2">
          <p className="text-muted-foreground">Trades</p>
          <p className="text-sm font-bold tabular-nums">{detail.totalTrades}</p>
        </div>
        <div className="rounded bg-muted/30 p-2">
          <p className="text-muted-foreground">Win Rate</p>
          <p className="text-sm font-bold tabular-nums">{detail.winRate}%</p>
        </div>
        <div className="rounded bg-muted/30 p-2">
          <p className="text-muted-foreground">Avg Duration</p>
          <p className="text-sm font-bold tabular-nums">
            {detail.trades.length > 0
              ? (() => {
                  const totalMin = detail.trades.reduce((s, t) => {
                    if (!t.duration) return s;
                    const p = t.duration.match(/(\d+)h\s*(\d+)m/);
                    return p ? s + parseInt(p[1]) * 60 + parseInt(p[2]) : s;
                  }, 0);
                  const avg = Math.round(totalMin / detail.trades.length);
                  return avg > 0 ? `${avg}m` : '--';
                })()
              : '--'}
          </p>
        </div>
      </div>

      {best && worst && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="rounded-sm bg-success/5 border border-success/10 p-2">
            <p className="text-[9px] uppercase tracking-wider text-success mb-1">Best Trade</p>
            <p className="text-xs font-semibold text-success">{best.symbol} {best.direction}</p>
            <p className="text-[10px] text-success">{formatPnl(Number(best.pnl))}</p>
          </div>
          <div className="rounded-sm bg-destructive/5 border border-destructive/10 p-2">
            <p className="text-[9px] uppercase tracking-wider text-destructive mb-1">Worst Trade</p>
            <p className="text-xs font-semibold text-destructive">{worst.symbol} {worst.direction}</p>
            <p className="text-[10px] text-destructive">{formatPnl(Number(worst.pnl))}</p>
          </div>
        </div>
      )}

      <div className="space-y-px max-h-64 overflow-y-auto">
        {detail.trades.map((t) => (
          <div key={t.id} className="flex items-center justify-between rounded-sm bg-muted/20 px-2 py-1.5 text-[11px] hover:bg-muted/40 transition-colors">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-medium text-foreground truncate">{t.symbol}</span>
              <StatusBadge variant={t.direction === 'LONG' ? 'long' : 'short'}>{t.direction}</StatusBadge>
              {t.duration && <span className="text-muted-foreground hidden md:inline">{t.duration}</span>}
            </div>
            <span className={cn('tabular-nums font-medium shrink-0', Number(t.pnl) >= 0 ? 'text-success' : 'text-destructive')}>
              {formatPnl(Number(t.pnl))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

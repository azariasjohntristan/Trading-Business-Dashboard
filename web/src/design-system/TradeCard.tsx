import { cn } from '@/lib/utils';
import { StatusBadge } from './StatusBadge';
import { formatPnl } from './format';
import type { Trade } from '@/types';

interface TradeCardProps {
  trade: Trade & { account?: { name: string } };
  onClick?: () => void;
  selected?: boolean;
}

export function TradeCard({ trade, onClick, selected }: TradeCardProps) {
  const pnl = Number(trade.pnl);
  const isWin = pnl >= 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        'group rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-3 card-hover animate-fade-in cursor-pointer',
        selected && 'border-primary/40 bg-primary/5',
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{trade.symbol}</span>
          <StatusBadge variant={trade.direction === 'LONG' ? 'long' : 'short'}>{trade.direction}</StatusBadge>
        </div>
        <span className={cn('text-base font-bold tabular-nums', isWin ? 'text-success' : 'text-destructive')}>
          {formatPnl(pnl)}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <span>Entry ${Number(trade.buyPrice).toFixed(2)}</span>
        <span>Exit ${Number(trade.sellPrice).toFixed(2)}</span>
        <span>Qty {Number(trade.qty).toFixed(2)}</span>
        <span>{trade.duration ?? '--'}</span>
        <span>{new Date(trade.soldTimestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        {trade.account?.name && <span>{trade.account.name}</span>}
      </div>
    </div>
  );
}

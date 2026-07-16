import { useState } from 'react';
import { cn } from '@/lib/utils';
import { StatusBadge } from './StatusBadge';
import { formatPnl } from './format';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import type { Trade } from '@/types';

interface TradeCardProps {
  trade: Trade & { account?: { name: string } };
  onClick?: () => void;
  selected?: boolean;
}

export function TradeCard({ trade, onClick, selected }: TradeCardProps) {
  const [expanded, setExpanded] = useState(false);
  const pnl = Number(trade.pnl);
  const isWin = pnl >= 0;

  const handleClick = () => {
    if (onClick) onClick();
    else setExpanded(!expanded);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'group rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] card-hover animate-fade-in cursor-pointer',
        selected && 'border-primary/40 bg-primary/5',
      )}
    >
      <div className="p-3 md:p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-semibold">{trade.symbol}</span>
            <StatusBadge variant={trade.direction === 'LONG' ? 'long' : 'short'}>{trade.direction}</StatusBadge>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={cn('text-base font-bold tabular-nums', isWin ? 'text-success' : 'text-destructive')}>
              {formatPnl(pnl)}
            </span>
            {!onClick && (
              expanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>
        </div>

        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
          <span>qty {Number(trade.qty).toFixed(2)}</span>
          <span>${Number(trade.buyPrice).toFixed(2)} → ${Number(trade.sellPrice).toFixed(2)}</span>
          <span>{trade.duration ?? '--'}</span>
          <span>{new Date(trade.soldTimestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      {expanded && !onClick && (
        <div className="border-t border-[hsl(var(--tv-border))] px-3 py-2 space-y-1.5 text-xs animate-slide-up">
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <div><span className="text-muted-foreground">Entry: </span>${Number(trade.buyPrice).toFixed(2)}</div>
            <div><span className="text-muted-foreground">Exit: </span>${Number(trade.sellPrice).toFixed(2)}</div>
            <div><span className="text-muted-foreground">Qty: </span>{Number(trade.qty).toFixed(2)}</div>
            <div><span className="text-muted-foreground">Duration: </span>{trade.duration ?? '--'}</div>
            <div><span className="text-muted-foreground">Entry Time: </span>{new Date(trade.boughtTimestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
            <div><span className="text-muted-foreground">Exit Time: </span>{new Date(trade.soldTimestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
            {trade.account?.name && <div><span className="text-muted-foreground">Account: </span>{trade.account.name}</div>}
          </div>
          {trade.chartLink && (
            <a href={trade.chartLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline mt-1">
              <ExternalLink className="h-3 w-3" /> Open Chart
            </a>
          )}
        </div>
      )}
    </div>
  );
}

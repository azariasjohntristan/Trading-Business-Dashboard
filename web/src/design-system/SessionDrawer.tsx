import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { formatPnl } from './format';
import { getDayScreenshotLink, setDayScreenshotLink } from '@/lib/dayScreenshot';
import { X, ChevronDown, ChevronUp, Clock, BarChart3, Check, Image, TrendingUp, TrendingDown, Camera, ExternalLink } from 'lucide-react';
import type { DailySession, Trade } from '@/types';

interface SessionDrawerProps {
  session: DailySession | null;
  onClose: () => void;
}

function MergedTrade({ trade, isLast }: { trade: Trade; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const positive = Number(trade.pnl) >= 0;
  const bought = new Date(trade.boughtTimestamp);
  const sold = new Date(trade.soldTimestamp);
  const time = bought.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div className="group">
      <div className="flex gap-3">
        <div className="flex flex-col items-center pt-1.5">
          <div className={cn('h-2.5 w-2.5 rounded-full ring-2 ring-offset-2 ring-offset-[hsl(var(--tv-bg))] transition-shadow group-hover:shadow-sm', positive ? 'bg-success ring-success/20' : 'bg-destructive ring-destructive/20')} />
          {!isLast && <div className="w-px flex-1 bg-border/60" />}
        </div>

        <div className={cn('flex-1 min-w-0 rounded-lg border transition-all', expanded ? 'border-primary/30 bg-[hsl(var(--tv-surface))]' : 'border-transparent hover:border-[hsl(var(--tv-border))] hover:bg-muted/20')}>
          <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-3 px-3 py-2 text-left">
            <span className="text-[10px] text-muted-foreground tabular-nums w-10 shrink-0">{time}</span>
            <span className={cn('text-[10px] font-semibold uppercase shrink-0', positive ? 'text-success' : 'text-destructive')}>{trade.direction}</span>
            <span className="text-xs font-medium truncate">{trade.symbol}</span>
            <span className={cn('text-xs font-bold tabular-nums ml-auto', positive ? 'text-success' : 'text-destructive')}>
              {formatPnl(Number(trade.pnl))}
            </span>
            <span className="text-[9px] text-muted-foreground tabular-nums shrink-0 hidden sm:inline">{trade.duration ?? '--'}</span>
            {expanded ? <ChevronUp className="h-3 w-3 text-muted-foreground shrink-0" /> : <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />}
          </button>

          {expanded && (
            <div className="border-t border-border/60 px-3 py-2.5 space-y-2 animate-slide-up">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
                <div className="flex justify-between"><span className="text-muted-foreground">Entry</span><span className="tabular-nums font-medium">${Number(trade.buyPrice).toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Exit</span><span className="tabular-nums font-medium">${Number(trade.sellPrice).toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Qty</span><span className="tabular-nums font-medium">{Number(trade.qty).toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span className="tabular-nums font-medium">{trade.duration ?? '--'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Entry Time</span><span className="tabular-nums font-medium">{bought.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Exit Time</span><span className="tabular-nums font-medium">{sold.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</span></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function SessionDrawer({ session, onClose }: SessionDrawerProps) {
  const [dayLink, setDayLink] = useState(session ? getDayScreenshotLink(session.date) : null);
  const [showScreenshotPopover, setShowScreenshotPopover] = useState(false);
  const [dayLinkInput, setDayLinkInput] = useState(dayLink ?? '');
  const popoverRef = useRef<HTMLDivElement>(null);

  const confirmDayLink = () => {
    const url = dayLinkInput || null;
    setDayLink(url);
    setDayScreenshotLink(date, url);
    setShowScreenshotPopover(false);
  };

  useEffect(() => {
    if (session) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [session]);

  useEffect(() => {
    if (session) {
      const saved = getDayScreenshotLink(session.date);
      setDayLink(saved);
      setDayLinkInput(saved ?? '');
      setShowScreenshotPopover(false);
    }
  }, [session?.date]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowScreenshotPopover(false);
      }
    };
    if (showScreenshotPopover) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showScreenshotPopover]);

  if (!session) return null;

  const { date, totalPnl, totalTrades, wins, winRate, profitFactor, avgWinner, avgLoser, bestTrade, worstTrade, avgHoldMinutes, firstTradeTime, lastTradeTime, trades } = session;
  const positive = totalPnl >= 0;
  const dayLabel = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const sortedTrades = [...trades].sort((a, b) => new Date(a.boughtTimestamp).getTime() - new Date(b.boughtTimestamp).getTime());

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl max-h-[90vh] bg-[hsl(var(--tv-bg))]/95 backdrop-blur-md border border-[hsl(var(--tv-border))] shadow-2xl rounded-xl animate-fade-in overflow-y-auto">
          <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-3.5 bg-[hsl(var(--tv-bg))]/95 backdrop-blur-md border-b border-[hsl(var(--tv-border))]">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-[10px] font-bold text-primary ring-1 ring-primary/20">D</div>
              <div>
                <p className="text-xs font-semibold">Trading Session Review</p>
                <p className="text-[10px] text-muted-foreground">{dayLabel}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <div className="relative" ref={popoverRef}>
                <button onClick={() => setShowScreenshotPopover(!showScreenshotPopover)} className={cn('flex h-7 w-7 items-center justify-center rounded-lg transition-colors', dayLink ? 'text-primary hover:bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted')} title="Day screenshot link">
                  {dayLink ? <Image className="h-3.5 w-3.5" /> : <Camera className="h-3.5 w-3.5" />}
                </button>

                {showScreenshotPopover && (
                  <div className="absolute right-0 top-full mt-1.5 w-72 rounded-lg border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-bg))] shadow-xl backdrop-blur-md p-3.5 z-20 animate-fade-in">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Day Screenshot Link</p>
                    {dayLink && (
                      <a href={dayLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline mb-2.5">
                        <ExternalLink className="h-3 w-3" /> Open current link
                      </a>
                    )}
                    <div className="flex items-center gap-2">
                      <input type="url" value={dayLinkInput} onChange={(e) => setDayLinkInput(e.target.value)}
                        placeholder="https://www.notion.so/..." autoFocus
                        className="h-7 flex-1 rounded border border-input bg-background px-2 text-xs ring-offset-background placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
                      <button onClick={confirmDayLink} className="shrink-0 flex h-7 w-7 items-center justify-center rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="px-5 py-5 space-y-5">

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              <div className="md:col-span-5 flex items-center gap-3">
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg shrink-0', positive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive')}>
                  {positive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                </div>
                <div>
                  <p className={cn('text-2xl font-bold tabular-nums tracking-tight leading-none', positive ? 'text-success' : 'text-destructive')}>
                    {formatPnl(totalPnl)}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="text-[11px] text-muted-foreground">Net P&L</p>
                    {[...new Set(trades.map(t => t.symbol))].map(s => (
                      <span key={s} className="inline-flex items-center px-1.5 py-0 rounded-full text-[9px] font-medium bg-muted/40 text-muted-foreground border border-border/50">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="md:col-span-3 rounded-lg border border-success/15 bg-success/5 p-3">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Best Trade</p>
                <p className="text-base font-bold tabular-nums mt-0.5 text-success">{formatPnl(bestTrade)}</p>
              </div>
              <div className="md:col-span-3 rounded-lg border border-destructive/15 bg-destructive/5 p-3">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Worst Trade</p>
                <p className="text-base font-bold tabular-nums mt-0.5 text-destructive">{formatPnl(worstTrade)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {[
                ['Total Trades', String(totalTrades)],
                ['Win Rate', `${winRate}%`],
                ['Profit Factor', profitFactor === -1 ? '∞' : profitFactor.toFixed(2)],
                ['Avg Winner', formatPnl(avgWinner), 'text-success'],
                ['Avg Loser', formatPnl(avgLoser), 'text-destructive'],
                ['Avg Hold Time', `${avgHoldMinutes}m`],
              ].map(([label, value, cls]) => (
                <div key={label as string} className="flex items-center justify-between border-b border-border/30 py-1.5">
                  <span className="text-[11px] text-muted-foreground">{label as string}</span>
                  <span className={cn('text-xs font-semibold tabular-nums', cls as string)}>{value as string}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground bg-muted/20 rounded-lg p-2.5 border border-border/50">
              <span className="flex items-center gap-1.5"><Clock className="h-3 w-3 text-primary" /> First: {firstTradeTime ?? '--'}</span>
              <span className="flex items-center gap-1.5"><Clock className="h-3 w-3 text-primary" /> Last: {lastTradeTime ?? '--'}</span>
              <span><span className="text-muted-foreground">Wins: </span><span className="font-medium text-success">{wins}</span><span className="text-muted-foreground"> / </span><span className="font-medium text-destructive">{totalTrades - wins}</span></span>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-3 flex items-center gap-1.5">
                <BarChart3 className="h-3 w-3" /> Timeline &middot; {totalTrades} trades
              </p>
              <div className="space-y-0">
                {sortedTrades.map((t, i) => (
                  <MergedTrade key={t.id} trade={t} isLast={i === sortedTrades.length - 1} />
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

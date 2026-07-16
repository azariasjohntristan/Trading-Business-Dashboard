import { useState, useEffect } from 'react';
import { apiGet, apiPost } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TradeCard, StatusBadge, formatPnl } from '@/design-system';
import type { Trade, Account } from '@/types';

interface TradesResponse {
  trades: Trade[];
  total: number;
  page: number;
  limit: number;
}

export default function Trades() {
  const [data, setData] = useState<Trade[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [directionFilter, setDirectionFilter] = useState('');
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [chartLinkInput, setChartLinkInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountFilter, setAccountFilter] = useState('');
  const limit = 50;

  useEffect(() => {
    apiGet<Account[]>('/accounts').then(setAccounts).catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (search) params.set('search', search);
    if (directionFilter) params.set('direction', directionFilter);
    if (accountFilter) params.set('accountId', accountFilter);
    params.set('sortBy', 'soldTimestamp');
    params.set('sortOrder', 'desc');

    apiGet<TradesResponse>(`/trades?${params}`).then((res) => {
      setData(res.trades);
      setTotal(res.total);
    }).catch(() => {});
  }, [page, search, directionFilter, accountFilter]);

  const totalPages = Math.ceil(total / limit);

  const handleEditChartLink = async () => {
    if (!selectedTrade) return;
    setSaving(true);
    try {
      await apiPost(`/trades/${selectedTrade.id}`, { chartLink: chartLinkInput });
      setSelectedTrade({ ...selectedTrade, chartLink: chartLinkInput });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-base font-semibold tracking-tight">Trade History</h1>
        <p className="text-[11px] text-muted-foreground">TradeZella-inspired trade journal</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder="Search symbol..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="h-7 rounded border border-input bg-background px-2 text-[11px] ring-offset-background placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <select
          value={directionFilter}
          onChange={(e) => { setDirectionFilter(e.target.value); setPage(1); }}
          className="h-7 rounded border border-input bg-background px-2 text-[11px] ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">All Directions</option>
          <option value="LONG">Long</option>
          <option value="SHORT">Short</option>
        </select>
        <select
          value={accountFilter}
          onChange={(e) => { setAccountFilter(e.target.value); setPage(1); }}
          className="h-7 rounded border border-input bg-background px-2 text-[11px] ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">All Accounts</option>
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <span className="text-[11px] text-muted-foreground">{total} trade{total !== 1 ? 's' : ''}</span>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className={cn('lg:col-span-2 space-y-3', selectedTrade && 'lg:col-span-2')}>
          <div className="grid gap-2 sm:grid-cols-2">
            {data.map((t) => (
              <TradeCard
                key={t.id}
                trade={t}
                onClick={() => { setSelectedTrade(t); setChartLinkInput(t.chartLink ?? ''); }}
                selected={selectedTrade?.id === t.id}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-muted-foreground">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="h-7 text-[11px] px-2">Previous</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="h-7 text-[11px] px-2">Next</Button>
              </div>
            </div>
          )}
        </div>

        {selectedTrade && (
          <div className="rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-4 h-fit animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Trade Details</h3>
              <StatusBadge variant={selectedTrade.direction === 'LONG' ? 'long' : 'short'}>{selectedTrade.direction}</StatusBadge>
            </div>

            <div className="text-center mb-4">
              <p className="text-xs text-muted-foreground">{selectedTrade.symbol}</p>
              <p className={cn('text-2xl font-bold tabular-nums', Number(selectedTrade.pnl) >= 0 ? 'text-success' : 'text-destructive')}>
                {formatPnl(Number(selectedTrade.pnl))}
              </p>
            </div>

            <dl className="space-y-2 text-xs">
              {[
                ['Entry Price', `$${Number(selectedTrade.buyPrice).toFixed(2)}`],
                ['Exit Price', `$${Number(selectedTrade.sellPrice).toFixed(2)}`],
                ['Quantity', Number(selectedTrade.qty).toFixed(2)],
                ['Duration', selectedTrade.duration ?? '--'],
                ['Entry Time', new Date(selectedTrade.boughtTimestamp).toLocaleString()],
                ['Exit Time', new Date(selectedTrade.soldTimestamp).toLocaleString()],
                ['Account', selectedTrade.account?.name ?? '--'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-medium tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-4 pt-3 border-t border-[hsl(var(--tv-border))] space-y-2">
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Chart Link</label>
              <input
                type="text"
                value={chartLinkInput}
                onChange={(e) => setChartLinkInput(e.target.value)}
                placeholder="https://tradingview.com/chart/..."
                className="h-7 w-full rounded border border-input bg-background px-2 text-[11px] ring-offset-background placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <Button size="sm" onClick={handleEditChartLink} disabled={saving} className="h-7 text-[11px] w-full">
                {saving ? 'Saving...' : 'Save Link'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

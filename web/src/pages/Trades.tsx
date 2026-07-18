import { useState, useEffect } from 'react';
import { apiGet, apiDelete } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { SessionCard, SessionDrawer, formatPnl } from '@/design-system';
import { Search, SlidersHorizontal, X, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSelectedAccount } from '@/contexts/SelectedAccountContext';
import type { DailySession, DailySessionsResponse } from '@/types';

export default function Trades() {
  const { accounts, selectedAccountId } = useSelectedAccount();
  const [sessions, setSessions] = useState<DailySession[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [directionFilter, setDirectionFilter] = useState('');
  const [accountFilter, setAccountFilter] = useState(selectedAccountId);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedSession, setSelectedSession] = useState<DailySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const limit = 20;

  useEffect(() => {
    setAccountFilter(selectedAccountId);
  }, [selectedAccountId]);

  const allPnl = sessions.reduce((s, se) => s + se.totalPnl, 0);
  const allTrades = sessions.reduce((s, se) => s + se.totalTrades, 0);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (search) params.set('search', search);
    if (directionFilter) params.set('direction', directionFilter);
    if (accountFilter) params.set('accountId', accountFilter);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);

    apiGet<DailySessionsResponse>(`/trades/daily-sessions?${params}`)
      .then((res) => { setSessions(res.sessions); setTotal(res.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search, directionFilter, accountFilter, dateFrom, dateTo, refreshKey]);

  const totalPages = Math.ceil(total / limit);

  const clearFilters = () => {
    setSearch(''); setDirectionFilter(''); setAccountFilter('');
    setDateFrom(''); setDateTo(''); setPage(1);
  };

  const hasFilters = search || directionFilter || accountFilter || dateFrom || dateTo;

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDeleteSession = async (date: string) => {
    try {
      await apiDelete(`/trades/date/${date}`);
      setRefreshKey(k => k + 1);
      if (selectedSession?.date === date) setSelectedSession(null);
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Trade Journal</h1>
          <p className="text-xs text-muted-foreground">Daily trading session review</p>
        </div>
        <button onClick={() => setFilterOpen(true)} className="inline-flex items-center gap-1.5 h-8 rounded-lg border border-border bg-card px-3 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-success/30 transition-colors">
          <SlidersHorizontal className="h-3.5 w-3.5" /> Filters{hasFilters ? ` (${[search, directionFilter, accountFilter, dateFrom, dateTo].filter(Boolean).length})` : ''}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 stagger-fade-in">
        <div className="rounded-lg border border-border bg-card p-3 card-hover">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Sessions</p>
          <p className="text-xl font-bold tabular-nums mt-0.5 animate-count-up">{total}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 card-hover">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Trades</p>
          <p className="text-xl font-bold tabular-nums mt-0.5 animate-count-up">{allTrades}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 card-hover">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total P&L</p>
          <p className={cn('text-xl font-bold tabular-nums mt-0.5 animate-count-up', allPnl >= 0 ? 'text-success' : 'text-destructive')}>{formatPnl(allPnl)}</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                {['Date', 'Symbols', 'P&L', 'Trades', 'WR', 'Hold', 'Best/Worst', 'Avg W/L', 'Time', ''].map(h => (
                  <th key={h} className="text-center text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-3 py-2.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border/50 animate-pulse">
                  {Array.from({ length: 10 }).map((_, j) => (
                    <td key={j} className="px-3 py-3"><div className="h-4 w-16 rounded bg-muted" /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-muted-foreground">No trading sessions found</p>
          {hasFilters && (
            <button onClick={clearFilters} className="mt-2 text-xs text-success hover:underline">Clear filters</button>
          )}
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-center text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-3 py-2.5">Date</th>
                  <th className="text-center text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-3 py-2.5">Symbols</th>
                  <th className="text-center text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-3 py-2.5">P&L</th>
                  <th className="text-center text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-3 py-2.5">Trades</th>
                  <th className="text-center text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-3 py-2.5">WR</th>
                  <th className="text-center text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-3 py-2.5">Hold</th>
                  <th className="text-center text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-3 py-2.5">Best/Worst</th>
                  <th className="text-center text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-3 py-2.5">Avg W/L</th>
                  <th className="text-center text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-3 py-2.5">Time</th>
                  <th className="w-16" />
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <SessionCard key={s.date} session={s} onClick={() => setSelectedSession(s)} selected={selectedSession?.date === s.date} onDelete={() => setDeleteConfirm(s.date)} />
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="h-8 text-xs px-3">Previous</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="h-8 text-xs px-3">Next</Button>
              </div>
            </div>
          )}
        </>
      )}

      {filterOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setFilterOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-card border border-border shadow-xl rounded-lg animate-fade-in overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="text-sm font-semibold">Filters</h3>
                <button onClick={() => setFilterOpen(false)} className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Search Symbol</label>
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input type="text" placeholder="Symbol..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                      className="h-9 w-full rounded-lg border border-input bg-background pl-8 pr-3 text-xs ring-offset-background placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Direction</label>
                  <select value={directionFilter} onChange={(e) => { setDirectionFilter(e.target.value); setPage(1); }}
                    className="h-9 w-full rounded-lg border border-input bg-background px-3 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary">
                    <option value="">All Directions</option>
                    <option value="LONG">Long</option>
                    <option value="SHORT">Short</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Account</label>
                  <select value={accountFilter} onChange={(e) => { setAccountFilter(e.target.value); setPage(1); }}
                    className="h-9 w-full rounded-lg border border-input bg-background px-3 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary">
                    <option value="">All Accounts</option>
                    {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}{a.initialCapital ? ` ($${a.initialCapital.toLocaleString()})` : ''}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Date From</label>
                  <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                    className="h-9 w-full rounded-lg border border-input bg-background px-3 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Date To</label>
                  <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                    className="h-9 w-full rounded-lg border border-input bg-background px-3 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary" />
                </div>
                {hasFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters} className="w-full h-9 text-xs gap-1">
                    <RefreshCw className="h-3 w-3" /> Clear All Filters
                  </Button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <SessionDrawer session={selectedSession} onClose={() => setSelectedSession(null)} />

      {deleteConfirm && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setDeleteConfirm(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-card border border-border shadow-xl rounded-lg animate-fade-in p-5">
              <h3 className="text-sm font-semibold mb-1">Delete session trades?</h3>
              <p className="text-xs text-muted-foreground mb-4">
                This will permanently delete all trades from <span className="font-medium text-foreground">{deleteConfirm}</span>. This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setDeleteConfirm(null)} className="h-8 text-xs">Cancel</Button>
                <Button type="button" size="sm" onClick={() => { handleDeleteSession(deleteConfirm); setDeleteConfirm(null); }} className="h-8 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

import { useState, useEffect, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table';
import { apiGet, apiPost } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { Trade, Account } from '@/types';

interface TradesResponse {
  trades: Trade[];
  total: number;
  page: number;
  limit: number;
}

interface TradeWithAccount extends Trade {
  account: { name: string };
}

function formatPnl(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', signDisplay: 'always' }).format(value);
}

const columnHelper = createColumnHelper<TradeWithAccount>();

export default function Trades() {
  const [data, setData] = useState<TradeWithAccount[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [directionFilter, setDirectionFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'soldTimestamp', desc: true }]);
  const [selectedTrade, setSelectedTrade] = useState<TradeWithAccount | null>(null);
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
    if (sorting.length > 0) {
      params.set('sortBy', sorting[0].id);
      params.set('sortOrder', sorting[0].desc ? 'desc' : 'asc');
    }

    apiGet<TradesResponse>(`/trades?${params}`).then((res) => {
      setData(res.trades as TradeWithAccount[]);
      setTotal(res.total);
    }).catch(() => {});
  }, [page, search, directionFilter, accountFilter, sorting]);

  const columns = useMemo(() => [
    columnHelper.accessor('symbol', {
      header: 'Symbol',
      cell: (info) => <span className="font-medium">{info.getValue()}</span>,
    }),
    columnHelper.accessor('direction', {
      header: 'Dir',
      cell: (info) => (
        <span className={cn(
          'inline-block rounded px-1.5 py-0.5 text-xs font-medium',
          info.getValue() === 'LONG' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive',
        )}>
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('qty', {
      header: 'Qty',
      cell: (info) => Number(info.getValue()).toFixed(2),
    }),
    columnHelper.accessor('buyPrice', {
      header: 'Entry',
      cell: (info) => `$${Number(info.getValue()).toFixed(2)}`,
    }),
    columnHelper.accessor('sellPrice', {
      header: 'Exit',
      cell: (info) => `$${Number(info.getValue()).toFixed(2)}`,
    }),
    columnHelper.accessor('pnl', {
      header: 'P&L',
      cell: (info) => (
        <span className={cn('font-medium', Number(info.getValue()) >= 0 ? 'text-success' : 'text-destructive')}>
          {formatPnl(Number(info.getValue()))}
        </span>
      ),
    }),
    columnHelper.accessor('soldTimestamp', {
      header: 'Date',
      cell: (info) => new Date(info.getValue()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }),
    columnHelper.accessor('duration', {
      header: 'Duration',
      cell: (info) => info.getValue() ?? '--',
    }),
    columnHelper.accessor('account.name', {
      id: 'account',
      header: 'Account',
      cell: (info) => info.getValue(),
    }),
  ], []);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: true,
  });

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Trades</h1>
        <p className="text-sm text-muted-foreground">Trade history and details</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search symbol..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
        <select
          value={directionFilter}
          onChange={(e) => { setDirectionFilter(e.target.value); setPage(1); }}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">All Directions</option>
          <option value="LONG">Long</option>
          <option value="SHORT">Short</option>
        </select>
        <select
          value={accountFilter}
          onChange={(e) => { setAccountFilter(e.target.value); setPage(1); }}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">All Accounts</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        <span className="flex items-center text-sm text-muted-foreground">
          {total} trade{total !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} className="border-b bg-muted/50">
                    {hg.headers.map((header) => (
                      <th
                        key={header.id}
                        onClick={header.column.getToggleSortingHandler()}
                        className={cn(
                          'px-3 py-2 text-left font-medium',
                          header.column.getCanSort() && 'cursor-pointer select-none hover:text-foreground',
                        )}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{ asc: ' ↑', desc: ' ↓' }[header.column.getIsSorted() as string] ?? ''}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => {
                      setSelectedTrade(row.original);
                      setChartLinkInput(row.original.chartLink ?? '');
                    }}
                    className={cn(
                      'cursor-pointer border-b last:border-0 hover:bg-muted/50',
                      selectedTrade?.id === row.original.id && 'bg-muted',
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-2">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        {selectedTrade && (
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold">Trade Details</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Symbol</dt>
                <dd className="font-medium">{selectedTrade.symbol}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Direction</dt>
                <dd>
                  <span className={cn(
                    'inline-block rounded px-1.5 py-0.5 text-xs font-medium',
                    selectedTrade.direction === 'LONG' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive',
                  )}>
                    {selectedTrade.direction}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Quantity</dt>
                <dd>{Number(selectedTrade.qty).toFixed(2)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Entry Price</dt>
                <dd>${Number(selectedTrade.buyPrice).toFixed(2)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Exit Price</dt>
                <dd>${Number(selectedTrade.sellPrice).toFixed(2)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">P&L</dt>
                <dd className={cn('font-medium', Number(selectedTrade.pnl) >= 0 ? 'text-success' : 'text-destructive')}>
                  {formatPnl(Number(selectedTrade.pnl))}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Duration</dt>
                <dd>{selectedTrade.duration ?? '--'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Entry Time</dt>
                <dd className="text-xs">{new Date(selectedTrade.boughtTimestamp).toLocaleString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Exit Time</dt>
                <dd className="text-xs">{new Date(selectedTrade.soldTimestamp).toLocaleString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Account</dt>
                <dd>{selectedTrade.account?.name}</dd>
              </div>
            </dl>

            <div className="mt-4 space-y-2">
              <label className="text-sm font-medium">Chart Link</label>
              <input
                type="text"
                value={chartLinkInput}
                onChange={(e) => setChartLinkInput(e.target.value)}
                placeholder="https://tradingview.com/chart/..."
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              <Button size="sm" onClick={handleEditChartLink} disabled={saving}>
                {saving ? 'Saving...' : 'Save Link'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

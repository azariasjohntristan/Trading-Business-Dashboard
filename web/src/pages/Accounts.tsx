import { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { formatPnl, SectionHeader } from '@/design-system';
import { useSelectedAccount } from '@/contexts/SelectedAccountContext';

interface AccountStat {
  id: string;
  name: string;
  description: string | null;
  initialCapital: number | null;
  currentBalance: number | null;
  returnPct: number | null;
  totalPnl: number;
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
}

export default function Accounts() {
  const { refreshAccounts } = useSelectedAccount();
  const [stats, setStats] = useState<AccountStat[]>([]);
  const [editing, setEditing] = useState<AccountStat | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [initialCapital, setInitialCapital] = useState('');

  const fetchStats = () => {
    apiGet<AccountStat[]>('/accounts/stats').then(setStats).catch(() => {});
  };

  useEffect(() => { fetchStats(); }, []);

  const totalPnl = stats.reduce((sum, a) => sum + a.totalPnl, 0);
  const totalTrades = stats.reduce((sum, a) => sum + a.totalTrades, 0);
  const avgWinRate = stats.length > 0 ? stats.reduce((sum, a) => sum + a.winRate, 0) / stats.length : 0;
  const totalCapital = stats.reduce((sum, a) => sum + (a.initialCapital ?? 0), 0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiPost('/accounts', { name, description, initialCapital: initialCapital ? Number(initialCapital) : null });
    setName(''); setDescription(''); setInitialCapital(''); setShowCreate(false); fetchStats(); refreshAccounts();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    await apiPut(`/accounts/${editing.id}`, { name, description, initialCapital: initialCapital ? Number(initialCapital) : null });
    setEditing(null); setName(''); setDescription(''); setInitialCapital(''); fetchStats(); refreshAccounts();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this account and all its trades?')) return;
    await apiDelete(`/accounts/${id}`);
    fetchStats(); refreshAccounts();
  };

  const openEdit = (a: AccountStat) => {
    setEditing(a); setName(a.name); setDescription(a.description ?? ''); setInitialCapital(a.initialCapital ? String(a.initialCapital) : '');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold tracking-tight">Accounts</h1>
          <p className="text-[11px] text-muted-foreground">Trading business command center</p>
        </div>
        <Button onClick={() => { setShowCreate(true); setName(''); setDescription(''); }} className="h-7 gap-1 text-[11px] px-2">
          <Plus className="h-3 w-3" /> New Account
        </Button>
      </div>

      <SectionHeader title="Portfolio Overview" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-3 card-hover">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Accounts</p>
          <p className="text-lg font-bold tabular-nums mt-1">{stats.length}</p>
        </div>
        <div className="rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-3 card-hover">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Capital</p>
          <p className="text-lg font-bold tabular-nums mt-1">{totalCapital ? `$${totalCapital.toLocaleString()}` : '---'}</p>
        </div>
        <div className="rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-3 card-hover">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Combined P&L</p>
          <p className={cn('text-lg font-bold tabular-nums mt-1', totalPnl >= 0 ? 'text-success' : 'text-destructive')}>{formatPnl(totalPnl)}</p>
        </div>
        <div className="rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-3 card-hover">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Overall Win Rate</p>
          <p className={cn('text-lg font-bold tabular-nums mt-1', avgWinRate >= 50 ? 'text-success' : 'text-destructive')}>{avgWinRate.toFixed(1)}%</p>
        </div>
        <div className="rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-3 card-hover">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Trades</p>
          <p className="text-lg font-bold tabular-nums mt-1">{totalTrades}</p>
        </div>
      </div>

      <SectionHeader title="Account Details" subtitle={`${stats.length} account${stats.length !== 1 ? 's' : ''}`} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((a) => (
          <div key={a.id} className="rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-3 card-hover animate-fade-in">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold">{a.name}</h3>
                {a.description && <p className="text-[10px] text-muted-foreground mt-0.5">{a.description}</p>}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => openEdit(a)}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(a.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 text-[11px]">
              {a.currentBalance != null && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Balance </span>
                  <span className="tabular-nums font-medium">${a.currentBalance.toLocaleString()}</span>
                  {a.returnPct != null && (
                    <span className={cn('ml-1.5 text-[10px] tabular-nums', a.returnPct >= 0 ? 'text-success' : 'text-destructive')}>
                      ({a.returnPct >= 0 ? '+' : ''}{a.returnPct}%)
                    </span>
                  )}
                </div>
              )}
              {a.initialCapital != null && (
                <div><span className="text-muted-foreground">Capital </span><span className="tabular-nums">${a.initialCapital.toLocaleString()}</span></div>
              )}
              <div><span className="text-muted-foreground">P&L </span>
                <span className={cn('tabular-nums font-medium', a.totalPnl >= 0 ? 'text-success' : 'text-destructive')}>{formatPnl(a.totalPnl)}</span>
              </div>
              <div><span className="text-muted-foreground">Trades </span><span className="tabular-nums">{a.totalTrades}</span></div>
              <div><span className="text-muted-foreground">Win Rate </span><span className="tabular-nums">{a.winRate}%</span></div>
              <div><span className="text-muted-foreground">Factor </span><span className="tabular-nums">{a.profitFactor === -1 ? '∞' : a.profitFactor}</span></div>
            </div>
          </div>
        ))}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-sm rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-sm font-semibold">Create Account</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="h-8 w-full rounded border border-input bg-background px-2.5 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Description</label>
                <input value={description} onChange={(e) => setDescription(e.target.value)} className="h-8 w-full rounded border border-input bg-background px-2.5 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Initial Capital</label>
                <input type="number" step="0.01" min="0" value={initialCapital} onChange={(e) => setInitialCapital(e.target.value)} placeholder="0.00" className="h-8 w-full rounded border border-input bg-background px-2.5 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowCreate(false)} className="h-7 text-xs">Cancel</Button>
                <Button type="submit" size="sm" className="h-7 text-xs">Create</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setEditing(null)}>
          <div className="w-full max-w-sm rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-sm font-semibold">Edit Account</h2>
            <form onSubmit={handleUpdate} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="h-8 w-full rounded border border-input bg-background px-2.5 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Description</label>
                <input value={description} onChange={(e) => setDescription(e.target.value)} className="h-8 w-full rounded border border-input bg-background px-2.5 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Initial Capital</label>
                <input type="number" step="0.01" min="0" value={initialCapital} onChange={(e) => setInitialCapital(e.target.value)} placeholder="0.00" className="h-8 w-full rounded border border-input bg-background px-2.5 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditing(null)} className="h-7 text-xs">Cancel</Button>
                <Button type="submit" size="sm" className="h-7 text-xs">Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

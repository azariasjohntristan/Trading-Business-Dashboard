import { useState, useEffect } from 'react';
import { apiGet, apiPost } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { Account } from '@/types';

interface AccountStat {
  id: string;
  name: string;
  description: string | null;
  totalPnl: number;
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
}

function formatPnl(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', signDisplay: 'always' }).format(value);
}

export default function Accounts() {
  const [stats, setStats] = useState<AccountStat[]>([]);
  const [editing, setEditing] = useState<AccountStat | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const fetchStats = () => {
    apiGet<AccountStat[]>('/accounts/stats').then(setStats).catch(() => {});
  };

  useEffect(() => { fetchStats(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiPost('/accounts', { name, description });
    setName('');
    setDescription('');
    setShowCreate(false);
    fetchStats();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    await apiPost(`/accounts/${editing.id}`, { name, description });
    setEditing(null);
    setName('');
    setDescription('');
    fetchStats();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this account and all its trades?')) return;
    await apiPost(`/accounts/${id}`, undefined);
    fetchStats();
  };

  const openEdit = (a: AccountStat) => {
    setEditing(a);
    setName(a.name);
    setDescription(a.description ?? '');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Accounts</h1>
          <p className="text-sm text-muted-foreground">Manage trading accounts</p>
        </div>
        <Button onClick={() => { setShowCreate(true); setName(''); setDescription(''); }}>
          <Plus className="mr-1 h-4 w-4" /> New Account
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((a) => (
          <div key={a.id} className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
            <div className="mb-2 flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{a.name}</h3>
                {a.description && (
                  <p className="text-xs text-muted-foreground">{a.description}</p>
                )}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(a)}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(a.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">P&L: </span>
                <span className={cn('font-medium', a.totalPnl >= 0 ? 'text-success' : 'text-destructive')}>
                  {formatPnl(a.totalPnl)}
                </span>
              </div>
              <div><span className="text-muted-foreground">Trades: </span>{a.totalTrades}</div>
              <div><span className="text-muted-foreground">Win Rate: </span>{a.winRate}%</div>
              <div>
                <span className="text-muted-foreground">Factor: </span>
                {a.profitFactor === -1 ? '∞' : a.profitFactor}
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Max Drawdown: </span>
                {formatPnl(a.maxDrawdown)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-semibold">Create Account</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditing(null)}>
          <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-semibold">Edit Account</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

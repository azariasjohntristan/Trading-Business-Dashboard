import { useState, useEffect } from 'react';
import { apiGet, apiPost } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { formatPnl } from '@/design-system';

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
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Accounts</h1>
          <p className="text-xs text-muted-foreground">Manage trading accounts</p>
        </div>
        <Button onClick={() => { setShowCreate(true); setName(''); setDescription(''); }} className="h-8 gap-1 text-xs">
          <Plus className="h-3.5 w-3.5" /> New Account
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((a) => (
          <div key={a.id} className="rounded-lg border bg-card p-4 transition-all hover:border-primary/30">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold">{a.name}</h3>
                {a.description && (
                  <p className="text-[11px] text-muted-foreground">{a.description}</p>
                )}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => openEdit(a)}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(a.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 text-[11px]">
              <div>
                <span className="text-muted-foreground">P&L </span>
                <span className={cn('tabular-nums font-medium', a.totalPnl >= 0 ? 'text-success' : 'text-destructive')}>
                  {formatPnl(a.totalPnl)}
                </span>
              </div>
              <div><span className="text-muted-foreground">Trades </span><span className="tabular-nums">{a.totalTrades}</span></div>
              <div><span className="text-muted-foreground">Win Rate </span><span className="tabular-nums">{a.winRate}%</span></div>
              <div>
                <span className="text-muted-foreground">Factor </span>
                <span className="tabular-nums">{a.profitFactor === -1 ? '∞' : a.profitFactor}</span>
              </div>
              <div className="col-span-2 border-t border-border/50 pt-1.5">
                <span className="text-muted-foreground">Max Drawdown </span>
                <span className="tabular-nums text-destructive">{formatPnl(a.maxDrawdown)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-sm rounded-lg border bg-card p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-sm font-semibold">Create Account</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-8 w-full rounded border border-input bg-background px-2.5 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Description</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-8 w-full rounded border border-input bg-background px-2.5 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
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
          <div className="w-full max-w-sm rounded-lg border bg-card p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-sm font-semibold">Edit Account</h2>
            <form onSubmit={handleUpdate} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-8 w-full rounded border border-input bg-background px-2.5 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Description</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-8 w-full rounded border border-input bg-background px-2.5 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
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

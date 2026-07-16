import { useState, useEffect } from 'react';
import { apiGet, apiPost } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SectionHeader } from '@/design-system';
import type { HealthCheck } from '@/types';

export default function Settings() {
  const [health, setHealth] = useState<HealthCheck | null>(null);
  const [lastImport, setLastImport] = useState<{ filename: string; importedAt: string } | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwMessage, setPwMessage] = useState('');
  const [pwError, setPwError] = useState('');
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    apiGet<HealthCheck>('/health').then(setHealth).catch(() => {});
    apiGet<{ filename: string; importedAt: string }[]>('/import/history')
      .then((h) => { if (h.length > 0) setLastImport(h[0]); })
      .catch(() => {});
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      setDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMessage(''); setPwError('');
    try {
      await apiPost('/auth/password', { currentPassword, newPassword });
      setPwMessage('Password updated successfully');
      setCurrentPassword(''); setNewPassword('');
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Failed to update password');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-base font-semibold tracking-tight">System</h1>
        <p className="text-[11px] text-muted-foreground">Trading business control center</p>
      </div>

      <SectionHeader title="System Health" />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Application</p>
          <p className="text-sm font-bold text-success mt-1">Running</p>
          <p className="text-[10px] text-muted-foreground mt-1">TradeOS v1.0</p>
        </div>
        <div className="rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Database</p>
          <p className={cn('text-sm font-bold mt-1', health?.database === 'connected' ? 'text-success' : 'text-destructive')}>
            {health?.database === 'connected' ? 'Connected' : 'Disconnected'}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">PostgreSQL 17</p>
        </div>
        <div className="rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Last Import</p>
          {lastImport ? (
            <>
              <p className="text-xs font-medium mt-1">{lastImport.filename}</p>
              <p className="text-[10px] text-muted-foreground">{new Date(lastImport.importedAt).toLocaleString()}</p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">No imports yet</p>
          )}
        </div>
      </div>

      <SectionHeader title="Security" />
      <div className="rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-4">
        <form onSubmit={handlePasswordChange} className="max-w-sm space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Current Password</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
              className="h-8 w-full rounded border border-input bg-background px-2.5 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">New Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              className="h-8 w-full rounded border border-input bg-background px-2.5 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" required minLength={6} />
          </div>
          {pwMessage && <p className="text-xs text-success">{pwMessage}</p>}
          {pwError && <p className="text-xs text-destructive">{pwError}</p>}
          <Button type="submit" size="sm" className="h-7 text-xs">Update Password</Button>
        </form>
      </div>

      <SectionHeader title="Appearance" />
      <div className="rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Dark Mode</p>
            <p className="text-[11px] text-muted-foreground">Toggle dark/light theme</p>
          </div>
          <button onClick={toggleTheme} className={cn('relative h-6 w-11 rounded-full transition-colors', dark ? 'bg-primary' : 'bg-muted')}>
            <span className={cn('absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform', dark && 'translate-x-5')} />
          </button>
        </div>
      </div>

      <SectionHeader title="Timezone" />
      <div className="rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-4">
        <p className="text-xs text-muted-foreground">All analytics use:</p>
        <p className="text-sm font-medium tabular-nums">America/New_York (Eastern Time)</p>
      </div>

      <SectionHeader title="System Information" />
      <div className="rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-4">
        <div className="grid gap-2 text-xs sm:grid-cols-2">
          <div><span className="text-muted-foreground">Version: </span>1.0.0</div>
          <div><span className="text-muted-foreground">Timezone: </span>America/New_York</div>
          <div><span className="text-muted-foreground">Frontend: </span>React + Vite + Tailwind</div>
          <div><span className="text-muted-foreground">Backend: </span>Express + Prisma</div>
          <div><span className="text-muted-foreground">Database: </span>PostgreSQL 17</div>
          <div><span className="text-muted-foreground">Deployment: </span>Docker Compose</div>
        </div>
      </div>
    </div>
  );
}

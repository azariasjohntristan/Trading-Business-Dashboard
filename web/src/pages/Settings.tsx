import { useState, useEffect } from 'react';
import { apiGet, apiPost } from '@/lib/api';
import { Button } from '@/components/ui/button';
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
    setPwMessage('');
    setPwError('');
    try {
      await apiPost('/auth/password', { currentPassword, newPassword });
      setPwMessage('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Failed to update password');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">User and system settings</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">User Settings</h2>
        <div className="rounded-lg border bg-card p-4">
          <form onSubmit={handlePasswordChange} className="max-w-sm space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
                minLength={6}
              />
            </div>
            {pwMessage && <p className="text-sm text-success">{pwMessage}</p>}
            {pwError && <p className="text-sm text-destructive">{pwError}</p>}
            <Button type="submit">Update Password</Button>
          </form>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Appearance</h2>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Dark Mode</p>
              <p className="text-xs text-muted-foreground">Toggle dark/light theme</p>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative h-6 w-11 rounded-full transition-colors ${dark ? 'bg-primary' : 'bg-muted'}`}
            >
              <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${dark ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Timezone</h2>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">All analytics use:</p>
          <p className="text-lg font-medium">America/New_York (Eastern Time)</p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">System Status</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">Backend</p>
            <p className="text-lg font-bold text-success">Running</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">Database</p>
            <p className={`text-lg font-bold ${health?.database === 'connected' ? 'text-success' : 'text-destructive'}`}>
              {health?.database === 'connected' ? 'Connected' : 'Disconnected'}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">Last Import</p>
            {lastImport ? (
              <div>
                <p className="text-sm font-medium">{lastImport.filename}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(lastImport.importedAt).toLocaleString()}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No imports yet</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

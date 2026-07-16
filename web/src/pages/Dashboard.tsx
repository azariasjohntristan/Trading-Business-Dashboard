import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';
import type { HealthCheck } from '@/types';

export default function Dashboard() {
  const [health, setHealth] = useState<HealthCheck | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<HealthCheck>('/health')
      .then(setHealth)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Your trading command center</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Today's P&L</p>
          <p className="text-2xl font-bold text-muted-foreground">---</p>
        </div>
        <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Win Rate</p>
          <p className="text-2xl font-bold text-muted-foreground">---</p>
        </div>
        <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Total Trades</p>
          <p className="text-2xl font-bold text-muted-foreground">---</p>
        </div>
        <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">System</p>
          <p className="text-xl font-bold">
            {loading ? (
              <span className="text-muted-foreground">Checking...</span>
            ) : health?.database === 'connected' ? (
              <span className="text-success">DB Online</span>
            ) : (
              <span className="text-destructive">DB Offline</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

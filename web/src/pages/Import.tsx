import { useState, useEffect, useRef } from 'react';
import { apiGet, apiUpload } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Account, ImportHistory } from '@/types';

interface ImportResult {
  filename: string;
  tradesDetected: number;
  newTradesImported: number;
  duplicatesSkipped: number;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
}

export default function Import() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [history, setHistory] = useState<(ImportHistory & { account: { name: string } })[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiGet<Account[]>('/accounts').then(setAccounts).catch(() => {});
    apiGet<(ImportHistory & { account: { name: string } })[]>('/import/history')
      .then(setHistory)
      .catch(() => {});
  }, []);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!selectedAccountId || !file) return;

    setImporting(true);
    setError('');
    setResult(null);

    try {
      const fd = new FormData();
      fd.append('accountId', selectedAccountId);
      fd.append('file', file);

      const res = await apiUpload<ImportResult>('/import', fd);
      setResult(res);

      const updated = await apiGet<(ImportHistory & { account: { name: string } })[]>('/import/history');
      setHistory(updated);

      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Import</h1>
        <p className="text-xs text-muted-foreground">Import trading CSV files</p>
      </div>

      <form onSubmit={handleImport} className="space-y-3 rounded-lg border bg-card p-5">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Account</label>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="h-8 w-full rounded border border-input bg-background px-2.5 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            required
          >
            <option value="">Select an account</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">CSV File</label>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="h-8 w-full rounded border border-input bg-background px-2.5 text-xs file:mr-2 file:border-0 file:bg-transparent file:text-xs file:font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            required
          />
        </div>

        <div className="flex items-center gap-3 pt-1">
          <Button type="submit" disabled={!selectedAccountId || importing} size="sm" className="h-7 text-xs">
            {importing ? 'Importing...' : 'Import CSV'}
          </Button>
          {result && (
            <span className={cn(
              'text-xs',
              result.status === 'SUCCESS' ? 'text-success' : result.status === 'PARTIAL' ? 'text-yellow-500' : 'text-destructive'
            )}>
              {result.status === 'SUCCESS' ? 'Import successful' :
               result.status === 'PARTIAL' ? 'Partial import' : 'Import failed'} —
              {result.tradesDetected} detected, {result.newTradesImported} new, {result.duplicatesSkipped} skipped
            </span>
          )}
        </div>

        {error && (
          <div className="rounded bg-destructive/10 p-2 text-xs text-destructive">{error}</div>
        )}
      </form>

      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Import History</h2>
        {history.length === 0 ? (
          <p className="text-xs text-muted-foreground">No imports yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Date</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Account</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">File</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Detected</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">New</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Duplicates</th>
                  <th className="px-3 py-2 text-center font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-3 py-2 text-muted-foreground">
                      {new Date(h.importedAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td className="px-3 py-2">{h.account.name}</td>
                    <td className="px-3 py-2 text-muted-foreground">{h.filename}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{h.tradesDetected}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{h.newTradesImported}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{h.duplicatesSkipped}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={cn(
                        'inline-block rounded-full px-2 py-0.5 text-[10px] font-medium leading-none',
                        h.status === 'SUCCESS' ? 'bg-success/10 text-success' :
                        h.status === 'PARTIAL' ? 'bg-yellow-500/10 text-yellow-500' :
                        'bg-destructive/10 text-destructive'
                      )}>
                        {h.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

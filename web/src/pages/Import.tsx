import { useState, useEffect, useRef } from 'react';
import { apiGet, apiUpload } from '@/lib/api';
import { Button } from '@/components/ui/button';
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Import</h1>
        <p className="text-sm text-muted-foreground">Import trading CSV files</p>
      </div>

      <form onSubmit={handleImport} className="space-y-4 rounded-lg border bg-card p-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Account</label>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            required
          >
            <option value="">Select an account</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">CSV File</label>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            required
          />
        </div>

        <Button type="submit" disabled={!selectedAccountId || importing}>
          {importing ? 'Importing...' : 'Import CSV'}
        </Button>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {result && (
          <div className={`rounded-md p-3 text-sm ${
            result.status === 'SUCCESS'
              ? 'bg-success/10 text-success'
              : result.status === 'PARTIAL'
              ? 'bg-yellow-500/10 text-yellow-600'
              : 'bg-destructive/10 text-destructive'
          }`}>
            <p className="font-medium">
              {result.status === 'SUCCESS' ? 'Import successful' :
               result.status === 'PARTIAL' ? 'Partial import' : 'Import failed'}
            </p>
            <p>Detected: {result.tradesDetected} | New: {result.newTradesImported} | Duplicates: {result.duplicatesSkipped}</p>
          </div>
        )}
      </form>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Import History</h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">No imports yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2 text-left font-medium">Date</th>
                  <th className="px-4 py-2 text-left font-medium">Account</th>
                  <th className="px-4 py-2 text-left font-medium">File</th>
                  <th className="px-4 py-2 text-right font-medium">Detected</th>
                  <th className="px-4 py-2 text-right font-medium">New</th>
                  <th className="px-4 py-2 text-right font-medium">Duplicates</th>
                  <th className="px-4 py-2 text-center font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-b last:border-0">
                    <td className="px-4 py-2 text-muted-foreground">
                      {new Date(h.importedAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-2">{h.account.name}</td>
                    <td className="px-4 py-2 text-muted-foreground">{h.filename}</td>
                    <td className="px-4 py-2 text-right">{h.tradesDetected}</td>
                    <td className="px-4 py-2 text-right">{h.newTradesImported}</td>
                    <td className="px-4 py-2 text-right">{h.duplicatesSkipped}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        h.status === 'SUCCESS' ? 'bg-success/10 text-success' :
                        h.status === 'PARTIAL' ? 'bg-yellow-500/10 text-yellow-600' :
                        'bg-destructive/10 text-destructive'
                      }`}>
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

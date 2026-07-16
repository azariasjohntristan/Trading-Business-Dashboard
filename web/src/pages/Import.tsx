import { useState, useEffect, useRef, useCallback } from 'react';
import { apiGet, apiUpload } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { StatusBadge, SectionHeader } from '@/design-system';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
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
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiGet<Account[]>('/accounts').then(setAccounts).catch(() => {});
    apiGet<(ImportHistory & { account: { name: string } })[]>('/import/history').then(setHistory).catch(() => {});
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragOver(true); }, []);
  const handleDragLeave = useCallback(() => { setDragOver(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) setSelectedFile(file);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const clearFile = () => { setSelectedFile(null); setResult(null); setError(''); if (fileRef.current) fileRef.current.value = ''; };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId || !selectedFile) return;

    setImporting(true); setError(''); setResult(null);

    try {
      const fd = new FormData();
      fd.append('accountId', selectedAccountId);
      fd.append('file', selectedFile);

      const res = await apiUpload<ImportResult>('/import', fd);
      setResult(res);

      const updated = await apiGet<(ImportHistory & { account: { name: string } })[]>('/import/history');
      setHistory(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const resetForm = () => { setSelectedAccountId(''); clearFile(); };

  const fileAnalysis = selectedFile ? {
    name: selectedFile.name,
    size: (selectedFile.size / 1024).toFixed(1),
    type: selectedFile.name.endsWith('.csv') ? 'CSV' : 'Unknown',
    status: 'Ready to import' as const,
  } : null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-base font-semibold tracking-tight">Import</h1>
        <p className="text-[11px] text-muted-foreground">Trading operations import center</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Account</p>
          <p className="text-sm font-medium tabular-nums mt-1">{selectedAccountId ? accounts.find(a => a.id === selectedAccountId)?.name ?? 'Selected' : 'Not selected'}</p>
        </div>
        <div className="rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">File</p>
          <p className="text-sm font-medium tabular-nums mt-1">{selectedFile?.name ?? 'No file'}</p>
        </div>
        <div className="rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">System Status</p>
          <p className="text-sm font-medium tabular-nums mt-1 text-success">Ready</p>
        </div>
      </div>

      <form onSubmit={handleImport} className="space-y-4">
        <div className={cn(
          'relative rounded-lg border-2 border-dashed p-8 md:p-12 text-center transition-all cursor-pointer group',
          dragOver ? 'border-primary bg-primary/5' : selectedFile ? 'border-success/50 bg-success/5' : 'border-[hsl(var(--tv-border))] hover:border-primary/30 hover:bg-muted/20'
        )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !selectedFile && fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />

          {selectedFile ? (
            <div className="flex flex-col items-center gap-3">
              <FileText className="h-8 w-8 text-success" />
              <div>
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-[11px] text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
              <button type="button" onClick={(e) => { e.stopPropagation(); clearFile(); }} className="absolute top-2 right-2 rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div>
              <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-3 group-hover:text-foreground transition-colors" />
              <p className="text-sm font-medium">Drop your trade file here</p>
              <p className="text-[11px] text-muted-foreground mt-1">Supports .csv exports from most brokers — click to browse</p>
            </div>
          )}
        </div>

        {fileAnalysis && (
          <div className="rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-4 animate-slide-up">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider">File Analysis</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Name</p>
                <p className="font-medium tabular-nums">{fileAnalysis.name}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Size</p>
                <p className="font-medium tabular-nums">{fileAnalysis.size} KB</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Format</p>
                <p className="font-medium">{fileAnalysis.type}</p>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-[hsl(var(--tv-border))]">
              <p className="text-[11px] text-success">{fileAnalysis.status}</p>
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <select value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)}
            className="h-8 rounded border border-input bg-background px-2.5 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" required>
            <option value="">Select Account</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>

          <Button type="submit" disabled={!selectedAccountId || !selectedFile || importing} className="h-8 text-xs">
            {importing ? 'Importing...' : 'Import CSV'}
          </Button>

          {result && (
            <Button type="button" variant="outline" size="sm" onClick={resetForm} className="h-8 text-xs">New Import</Button>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-sm bg-destructive/10 p-2 text-xs text-destructive">
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </div>
        )}

        {result && (
          <div className={cn('rounded border p-4 animate-slide-up', result.status === 'SUCCESS' ? 'border-success/30 bg-success/5' : result.status === 'PARTIAL' ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-destructive/30 bg-destructive/5')}>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className={cn('h-4 w-4', result.status === 'SUCCESS' ? 'text-success' : result.status === 'PARTIAL' ? 'text-yellow-500' : 'text-destructive')} />
              <span className={cn('text-xs font-semibold uppercase tracking-wider', result.status === 'SUCCESS' ? 'text-success' : result.status === 'PARTIAL' ? 'text-yellow-500' : 'text-destructive')}>
                {result.status === 'SUCCESS' ? 'Import Successful' : result.status === 'PARTIAL' ? 'Partial Import' : 'Import Failed'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Trades Detected</p>
                <p className="text-lg font-bold tabular-nums">{result.tradesDetected}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">New Imported</p>
                <p className="text-lg font-bold tabular-nums text-success">{result.newTradesImported}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Duplicates Skipped</p>
                <p className="text-lg font-bold tabular-nums text-muted-foreground">{result.duplicatesSkipped}</p>
              </div>
            </div>
          </div>
        )}
      </form>

      <div className="space-y-3">
        <SectionHeader title="Import History" />
        {history.length === 0 ? (
          <p className="text-xs text-muted-foreground">No imports yet.</p>
        ) : (
          <div className="overflow-x-auto rounded border border-[hsl(var(--tv-border))]">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[hsl(var(--tv-border))] bg-muted/30">
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
                  <tr key={h.id} className="border-b border-[hsl(var(--tv-border))] last:border-0 hover:bg-muted/20">
                    <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                      {new Date(h.importedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-3 py-2">{h.account.name}</td>
                    <td className="px-3 py-2 text-muted-foreground">{h.filename}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{h.tradesDetected}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{h.newTradesImported}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{h.duplicatesSkipped}</td>
                    <td className="px-3 py-2 text-center">
                      <StatusBadge variant={h.status === 'SUCCESS' ? 'success' : h.status === 'PARTIAL' ? 'warning' : 'failure'}>{h.status}</StatusBadge>
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

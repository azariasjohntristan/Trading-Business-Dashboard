import { useState, useEffect, useRef, useCallback } from 'react';
import { apiGet, apiUpload } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { StatusBadge, SectionHeader } from '@/design-system';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import type { Account, ImportHistory } from '@/types';

interface ImportResult {
  filename: string;
  tradesDetected: number;
  newTradesImported: number;
  duplicatesSkipped: number;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
}

const steps = ['Select Account', 'Upload CSV', 'Validate', 'Import', 'Update Dashboard'];

export default function Import() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [history, setHistory] = useState<(ImportHistory & { account: { name: string } })[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiGet<Account[]>('/accounts').then(setAccounts).catch(() => {});
    apiGet<(ImportHistory & { account: { name: string } })[]>('/import/history')
      .then(setHistory)
      .catch(() => {});
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      setSelectedFile(file);
      setCurrentStep(2);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setCurrentStep(2);
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId || !selectedFile) return;

    setImporting(true);
    setError('');
    setResult(null);
    setCurrentStep(3);

    try {
      const fd = new FormData();
      fd.append('accountId', selectedAccountId);
      fd.append('file', selectedFile);

      const res = await apiUpload<ImportResult>('/import', fd);
      setResult(res);
      setCurrentStep(4);

      const updated = await apiGet<(ImportHistory & { account: { name: string } })[]>('/import/history');
      setHistory(updated);
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      setCurrentStep(2);
    } finally {
      setImporting(false);
    }
  };

  const resetForm = () => {
    setSelectedAccountId('');
    setSelectedFile(null);
    setResult(null);
    setError('');
    setCurrentStep(0);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-base font-semibold tracking-tight">Import Trades</h1>
        <p className="text-[11px] text-muted-foreground">Professional trading operations center</p>
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

      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        {steps.map((step, i) => (
          <div key={step} className="flex items-center gap-2">
            <span className={cn(
              'flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-medium',
              i < currentStep ? 'bg-success text-white' : i === currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}>
              {i < currentStep ? '✓' : i + 1}
            </span>
            <span className={cn(i <= currentStep ? 'text-foreground' : 'text-muted-foreground')}>{step}</span>
            {i < steps.length - 1 && <span className="w-4 border-t border-border" />}
          </div>
        ))}
      </div>

      <form onSubmit={handleImport} className="space-y-4">
        <div className={cn(
          'rounded border-2 border-dashed p-6 text-center transition-all',
          dragOver ? 'border-primary bg-primary/5' : selectedFile ? 'border-success/50 bg-success/5' : 'border-[hsl(var(--tv-border))] hover:border-primary/30'
        )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          {selectedFile ? (
            <div className="flex items-center justify-center gap-2">
              <FileText className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-[10px] text-muted-foreground">Click to change file</p>
              </div>
            </div>
          ) : (
            <div className="cursor-pointer">
              <Upload className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Drop CSV file here or click to browse</p>
              <p className="text-[10px] text-muted-foreground mt-1">Only .csv files are accepted</p>
            </div>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <select
            value={selectedAccountId}
            onChange={(e) => { setSelectedAccountId(e.target.value); if (!currentStep) setCurrentStep(1); }}
            className="h-8 rounded border border-input bg-background px-2.5 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            required
          >
            <option value="">Select Account</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>

          <Button
            type="submit"
            disabled={!selectedAccountId || !selectedFile || importing}
            className="h-8 text-xs"
          >
            {importing ? 'Importing...' : 'Import CSV'}
          </Button>

          {result && (
            <Button type="button" variant="outline" size="sm" onClick={resetForm} className="h-8 text-xs">
              New Import
            </Button>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-sm bg-destructive/10 p-2 text-xs text-destructive">
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </div>
        )}

        {result && (
          <div className={cn(
            'flex items-center gap-2 rounded-sm p-2 text-xs',
            result.status === 'SUCCESS' ? 'bg-success/10 text-success' :
            result.status === 'PARTIAL' ? 'bg-yellow-500/10 text-yellow-500' :
            'bg-destructive/10 text-destructive'
          )}>
            <CheckCircle className="h-3.5 w-3.5" />
            <span className="font-medium">
              {result.status === 'SUCCESS' ? 'Import successful' :
               result.status === 'PARTIAL' ? 'Partial import' : 'Import failed'}
            </span>
            <span className="text-muted-foreground">
              — {result.tradesDetected} detected, {result.newTradesImported} new, {result.duplicatesSkipped} skipped
            </span>
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
                      <StatusBadge variant={h.status === 'SUCCESS' ? 'success' : h.status === 'PARTIAL' ? 'warning' : 'failure'}>
                        {h.status}
                      </StatusBadge>
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

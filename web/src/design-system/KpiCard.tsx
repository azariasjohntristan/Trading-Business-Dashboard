import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: string;
  isCurrency?: boolean;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
}

export function KpiCard({ label, value, isCurrency, trend, subtitle }: KpiCardProps) {
  const isNegative = isCurrency && value.startsWith('-');
  const trendColor = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : '';

  return (
    <div className="group rounded-lg border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-[0_0_15px_rgba(8,153,129,0.15)]">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        {trend && (
          <span className={cn('text-lg font-bold leading-none', trendColor)}>
            {trend === 'up' ? '▲' : trend === 'down' ? '▼' : ''}
          </span>
        )}
      </div>
      <p className={cn('mt-1 text-xl font-bold tabular-nums tracking-tight', isCurrency && (isNegative ? 'text-destructive' : 'text-success'))}>
        {value}
      </p>
      {subtitle && <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

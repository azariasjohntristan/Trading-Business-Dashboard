import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: string;
  isCurrency?: boolean;
  trend?: 'up' | 'down';
  subtitle?: string;
  comparison?: string;
  className?: string;
}

export function KpiCard({ label, value, isCurrency, trend, subtitle, comparison, className }: KpiCardProps) {
  const isNegative = isCurrency && value.startsWith('-');

  return (
    <div className={cn(
      'rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-3 md:p-4 card-hover animate-fade-in',
      className,
    )}>
      <span className="text-[10px] md:text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="mt-1 flex items-baseline gap-2">
        <p className={cn(
          'text-xl md:text-2xl font-bold tabular-nums tracking-tight leading-none animate-count-up',
          isCurrency && (isNegative ? 'text-destructive' : 'text-success'),
        )}>
          {value}
        </p>
        {trend && (
          <span className={cn('text-sm font-bold', trend === 'up' ? 'text-success' : 'text-destructive')}>
            {trend === 'up' ? '▲' : '▼'}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-[10px] md:text-[11px] text-muted-foreground">{subtitle}</p>}
      {comparison && <p className="mt-0.5 text-[10px] text-muted-foreground/60">{comparison}</p>}
    </div>
  );
}

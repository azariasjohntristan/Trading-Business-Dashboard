import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: string;
  isCurrency?: boolean;
  trend?: 'up' | 'down';
  subtitle?: string;
  className?: string;
}

export function KpiCard({ label, value, isCurrency, trend, subtitle, className }: KpiCardProps) {
  const isNegative = isCurrency && value.startsWith('-');

  return (
    <div className={cn('group rounded border border-[hsl(var(--tv-border))] bg-[hsl(var(--tv-surface))] p-3 card-hover animate-fade-in', className)}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        {trend && (
          <span className={cn('text-sm font-bold leading-none', trend === 'up' ? 'text-success' : 'text-destructive')}>
            {trend === 'up' ? '▲' : '▼'}
          </span>
        )}
      </div>
      <p className={cn(
        'mt-1.5 text-xl font-bold tabular-nums tracking-tight',
        isCurrency && (isNegative ? 'text-destructive' : 'text-success')
      )}>
        {value}
      </p>
      {subtitle && <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

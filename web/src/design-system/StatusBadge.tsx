import { cn } from '@/lib/utils';

type BadgeVariant = 'long' | 'short' | 'win' | 'loss' | 'success' | 'failure' | 'info' | 'warning';

interface StatusBadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  long: 'bg-success/10 text-success border-success/20',
  short: 'bg-destructive/10 text-destructive border-destructive/20',
  win: 'bg-success/10 text-success border-success/20',
  loss: 'bg-destructive/10 text-destructive border-destructive/20',
  success: 'bg-success/10 text-success border-success/20',
  failure: 'bg-destructive/10 text-destructive border-destructive/20',
  info: 'bg-muted text-muted-foreground border-border',
  warning: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
};

export function StatusBadge({ variant, children, className }: StatusBadgeProps) {
  return (
    <span className={cn('inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] font-medium leading-none', variants[variant], className)}>
      {children}
    </span>
  );
}

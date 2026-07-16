import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  variant: 'long' | 'short' | 'win' | 'loss' | 'success' | 'failure' | 'info';
  children: React.ReactNode;
}

const variants: Record<string, string> = {
  long: 'bg-success/10 text-success border-success/20',
  short: 'bg-destructive/10 text-destructive border-destructive/20',
  win: 'bg-success/10 text-success border-success/20',
  loss: 'bg-destructive/10 text-destructive border-destructive/20',
  success: 'bg-success/10 text-success border-success/20',
  failure: 'bg-destructive/10 text-destructive border-destructive/20',
  info: 'bg-muted text-muted-foreground border-border',
};

export function StatusBadge({ variant, children }: StatusBadgeProps) {
  return (
    <span className={cn('inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[11px] font-medium leading-none', variants[variant])}>
      {children}
    </span>
  );
}

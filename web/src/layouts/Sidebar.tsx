import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const links = [
  { to: '/dashboard', label: 'Command Center', icon: '◉' },
  { to: '/calendar', label: 'Trading Calendar', icon: '📅' },
  { to: '/analytics', label: 'Analytics', icon: '📈' },
  { to: '/trades', label: 'Trade History', icon: '📋' },
  { to: '/import', label: 'Import Trades', icon: '📥' },
  { to: '/accounts', label: 'Accounts', icon: '🏦' },
  { to: '/settings', label: 'System', icon: '⚙' },
];

export default function Sidebar() {
  return (
    <aside className="flex h-full w-56 flex-col border-r border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-bg))]">
      <div className="flex h-14 items-center gap-2.5 border-b border-[hsl(var(--sidebar-border))] px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded bg-primary text-xs font-bold text-primary-foreground">
          T
        </div>
        <span className="text-sm font-semibold tracking-tight">TradeOS</span>
      </div>
      <nav className="flex-1 space-y-px p-3">
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'relative flex items-center gap-3 rounded-sm px-3 py-2 text-[13px] font-medium transition-all duration-150',
                isActive
                  ? 'bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-fg))] before:absolute before:left-0 before:top-1/2 before:h-4 before:w-[3px] before:-translate-y-1/2 before:rounded-r-full before:bg-primary'
                  : 'text-[hsl(var(--sidebar-muted))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-fg))]',
              )
            }
          >
            <span className="text-sm leading-none">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-[hsl(var(--sidebar-border))] p-4">
        <p className="text-[10px] text-[hsl(var(--sidebar-muted))] uppercase tracking-wider">Trading Business OS v1.0</p>
      </div>
    </aside>
  );
}

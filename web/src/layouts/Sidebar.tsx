import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  BarChart3,
  ArrowLeftRight,
  Upload,
  Building2,
  Settings,
} from 'lucide-react';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/trades', label: 'Trades', icon: ArrowLeftRight },
  { to: '/import', label: 'Import', icon: Upload },
  { to: '/accounts', label: 'Accounts', icon: Building2 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="flex h-full w-56 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded bg-primary text-xs font-bold text-primary-foreground">
          T
        </div>
        <span className="text-sm font-semibold tracking-tight">TradeOS</span>
      </div>
      <nav className="flex-1 space-y-px p-3">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'relative flex items-center gap-3 rounded-sm px-3 py-2 text-[13px] font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-foreground before:absolute before:left-0 before:top-1/2 before:h-4 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-primary'
                  : 'text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground',
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-sidebar-border p-4">
        <p className="text-[11px] text-sidebar-muted">Trading Business OS</p>
      </div>
    </aside>
  );
}

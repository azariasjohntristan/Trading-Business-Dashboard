import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  CalendarDays,
  BarChart3,
  BookOpen,
  Upload,
  Building2,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const links = [
  { to: '/dashboard', label: 'Command Center', icon: LayoutDashboard },
  { to: '/calendar', label: 'Trading Calendar', icon: CalendarDays },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/trades', label: 'Trade Journal', icon: BookOpen },
  { to: '/import', label: 'Import Center', icon: Upload },
  { to: '/accounts', label: 'Accounts', icon: Building2 },
  { to: '/settings', label: 'System', icon: Settings },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const content = (
    <aside className={cn(
      'flex h-full flex-col border-r border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-bg))] transition-all duration-300',
      collapsed ? 'w-16' : 'w-56',
    )}>
      <div className={cn(
        'flex h-14 items-center border-b border-[hsl(var(--sidebar-border))] transition-all duration-300',
        collapsed ? 'justify-center px-0' : 'gap-2.5 px-5',
      )}>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-primary text-xs font-bold text-primary-foreground">T</div>
        <span className={cn('text-sm font-semibold tracking-tight overflow-hidden transition-all duration-300', collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100')}>TradeOS</span>
      </div>

      <nav className="flex-1 space-y-px p-2">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => { if (mobileOpen) onMobileClose(); }}
            className={({ isActive }) =>
              cn(
                'relative flex items-center rounded-md text-[13px] font-medium transition-all duration-150',
                collapsed ? 'justify-center h-10 w-10 mx-auto' : 'gap-3 px-3 py-2',
                isActive
                  ? 'bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-fg))]'
                  : 'text-[hsl(var(--sidebar-muted))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-fg))]',
              )
            }
            title={collapsed ? label : undefined}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className={cn('overflow-hidden whitespace-nowrap transition-all duration-300', collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100')}>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-[hsl(var(--sidebar-border))] p-2">
        <button
          onClick={onToggle}
          className="flex h-8 w-full items-center justify-center rounded-md text-[hsl(var(--sidebar-muted))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-fg))] transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );

  return (
    <>
      <div className={cn('hidden md:flex h-full', collapsed ? 'w-16' : 'w-56')} style={{ transition: 'width 0.3s' }}>
        {content}
      </div>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={onMobileClose} />
          <div className="relative h-full w-64 animate-fade-in">
            {content}
            <button onClick={onMobileClose} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

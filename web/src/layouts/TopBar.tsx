import { useState, useEffect } from 'react';
import { LogOut, Bell, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiGet } from '@/lib/api';
import type { Account } from '@/types';

interface TopBarProps {
  onMenuClick: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const { user, logout } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    apiGet<Account[]>('/accounts').then(setAccounts).catch(() => {});
  }, []);

  return (
    <header className="flex h-14 items-center justify-between border-b border-[hsl(var(--tv-border))] bg-background px-3 md:px-5">
      <div className="flex items-center gap-2">
        <button onClick={onMenuClick} className="flex md:hidden h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <Menu className="h-4 w-4" />
        </button>
        <select className="h-7 rounded border border-input bg-background px-2 text-xs text-muted-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring max-w-[140px] md:max-w-none">
          <option value="">All Accounts</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2 md:gap-3">
        <button className="relative text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">
            {user?.username.charAt(0).toUpperCase()}
          </div>
          <span className="hidden md:inline text-xs font-medium text-foreground">{user?.username}</span>
        </div>
        <button onClick={logout} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors" title="Logout">
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}

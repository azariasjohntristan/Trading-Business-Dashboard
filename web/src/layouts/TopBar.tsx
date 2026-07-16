import { Bell, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export default function TopBar() {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-5">
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">All Accounts</span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <Bell className="h-4 w-4" />
        </Button>
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">
          {user?.username.charAt(0).toUpperCase()}
        </div>
        <span className="text-xs font-medium text-foreground">{user?.username}</span>
        <Button variant="ghost" size="sm" onClick={logout} className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground">
          <LogOut className="h-3.5 w-3.5" />
          Logout
        </Button>
      </div>
    </header>
  );
}

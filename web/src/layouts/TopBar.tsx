import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TopBar() {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">All Accounts</span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Bell className="h-4 w-4" />
        </Button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
          U
        </div>
      </div>
    </header>
  );
}

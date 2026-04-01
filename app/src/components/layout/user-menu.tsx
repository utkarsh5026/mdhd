import { Cloud, LogOut } from 'lucide-react';

import Avatar from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  getOAuthUrl,
  useAuthActions,
  useAuthLoading,
  useAuthUser,
  useIsAuthenticated,
} from '@/services/auth';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const UserMenu = () => {
  const user = useAuthUser();
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useAuthLoading();
  const { logout } = useAuthActions();

  if (isLoading) {
    return <div className="h-7 w-7 rounded-full bg-muted/50 animate-pulse ring-1 ring-border/20" />;
  }

  if (!isAuthenticated || !user) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="gap-2 text-xs h-9 rounded-full px-3 border-border/60 hover:border-border hover:bg-accent/50 transition-all"
        onClick={() => {
          window.location.href = getOAuthUrl('google');
        }}
      >
        <GoogleIcon />
        <span className="hidden sm:inline">Sign in</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'relative h-6 w-6 rounded-full overflow-hidden',
            'ring-2 ring-transparent hover:ring-primary/40 transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            'active:scale-95'
          )}
        >
          <Avatar
            name={user.name || user.email}
            src={user.avatar_url}
            size="sm"
            referrerPolicy="no-referrer"
            className="ring-0"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-64 p-0">
        <div className="px-4 py-3.5 flex items-center gap-3">
          <Avatar
            name={user.name || user.email}
            src={user.avatar_url}
            size="lg"
            referrerPolicy="no-referrer"
            className="ring-2 ring-border/30"
          />
          <div className="flex flex-col min-w-0">
            {user.name && (
              <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
            )}
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
        <DropdownMenuSeparator className="m-0" />
        <div className="p-1.5">
          <DropdownMenuItem disabled className="rounded-md">
            <Cloud className="mr-2.5 h-4 w-4 text-muted-foreground" />
            Sync
          </DropdownMenuItem>
        </div>
        <DropdownMenuSeparator className="m-0" />
        <div className="p-1.5">
          <DropdownMenuItem
            onClick={logout}
            className="rounded-md text-muted-foreground focus:text-destructive"
          >
            <LogOut className="mr-2.5 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

UserMenu.displayName = 'UserMenu';
export default UserMenu;

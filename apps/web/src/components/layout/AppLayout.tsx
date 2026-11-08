import { Film, ListVideo, LogOut, type LucideIcon, Monitor } from 'lucide-react';
import { NavLink, Outlet } from 'react-router';
import { Logo } from '@/components/Logo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/features/auth/auth-context';
import { useScreensRealtime } from '@/features/screens/useScreensRealtime';
import { cn } from '@/lib/utils';

const NAV: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/screens', label: 'Telas', icon: Monitor },
  { to: '/media', label: 'Mídias', icon: Film },
  { to: '/playlists', label: 'Playlists', icon: ListVideo },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  useScreensRealtime();
  const initial = user?.email.charAt(0).toUpperCase() ?? '?';

  return (
    <div className="flex min-h-svh">
      {/* Sidebar fina: só ícones no mobile, ícone + rótulo a partir de md */}
      <aside className="sticky top-0 flex h-svh w-16 shrink-0 flex-col border-r bg-sidebar px-3 py-5 md:w-56">
        <Logo className="mb-8 px-1.5" withText={false} />
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              title={label}
              className={({ isActive }) =>
                cn(
                  'flex h-9 items-center gap-3 rounded-lg px-2.5 text-sm font-medium transition-colors',
                  'justify-center md:justify-start',
                  isActive
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                )
              }
            >
              <Icon className="size-4 shrink-0" />
              <span className="hidden md:inline">{label}</span>
            </NavLink>
          ))}
        </nav>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex h-10 w-full items-center justify-center gap-2.5 rounded-lg px-1.5 text-left outline-none transition-colors hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring md:justify-start">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
              {initial}
            </span>
            <span className="hidden truncate text-sm text-muted-foreground md:inline">
              {user?.email}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
              {user?.email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={logout}>
              <LogOut />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-10 md:py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

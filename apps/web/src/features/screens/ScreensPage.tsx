import { Loader2, MapPin, Monitor, MoreHorizontal, Pencil, Plus, Unlink } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatRelative } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useScreens, useUpdateScreen } from './api';
import { EditScreenDialog } from './EditScreenDialog';
import { PairScreenDialog } from './PairScreenDialog';
import { PlaylistSelect } from './PlaylistSelect';
import { RemoveScreenDialog } from './RemoveScreenDialog';
import type { Screen } from './types';

export function ScreensPage() {
  const screens = useScreens();
  const [pairing, setPairing] = useState(false);
  const [editing, setEditing] = useState<Screen | null>(null);
  const [removing, setRemoving] = useState<Screen | null>(null);

  const addButton = (
    <Button onClick={() => setPairing(true)}>
      <Plus /> Adicionar tela
    </Button>
  );

  return (
    <>
      <PageHeader
        title="Telas"
        description="Dispositivos que exibem suas playlists."
        actions={screens.data?.length ? addButton : null}
      />

      {screens.isPending ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : screens.isError ? (
        <p className="py-20 text-center text-sm text-muted-foreground">
          Não foi possível carregar as telas.
        </p>
      ) : screens.data.length === 0 ? (
        <EmptyState
          icon={Monitor}
          title="Abra /player no navegador de uma TV ou computador e pareie com o código exibido."
          action={addButton}
        />
      ) : (
        <ul className="divide-y overflow-hidden rounded-xl border bg-card shadow-xs">
          {screens.data.map((screen) => (
            <ScreenRow
              key={screen.id}
              screen={screen}
              onEdit={() => setEditing(screen)}
              onRemove={() => setRemoving(screen)}
            />
          ))}
        </ul>
      )}

      <PairScreenDialog open={pairing} onOpenChange={setPairing} />
      <EditScreenDialog screen={editing} onClose={() => setEditing(null)} />
      <RemoveScreenDialog screen={removing} onClose={() => setRemoving(null)} />
    </>
  );
}

function ScreenRow({
  screen,
  onEdit,
  onRemove,
}: {
  screen: Screen;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const update = useUpdateScreen();

  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <StatusDot online={screen.online} lastSeenAt={screen.lastSeenAt} />
        <div className="min-w-0">
          <p className="truncate font-medium">{screen.name}</p>
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
            {screen.location && (
              <>
                <MapPin className="size-3 shrink-0" />
                <span className="truncate">{screen.location}</span>
                <span aria-hidden>·</span>
              </>
            )}
            <span className="shrink-0">
              {screen.online
                ? 'Online'
                : screen.lastSeenAt
                  ? `Visto ${formatRelative(screen.lastSeenAt)}`
                  : 'Nunca conectada'}
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 pl-5 sm:pl-0">
        <PlaylistSelect
          className="sm:w-56"
          value={screen.playlist?.id ?? null}
          disabled={update.isPending}
          onChange={(playlistId) =>
            update.mutate(
              { id: screen.id, playlistId },
              {
                onSuccess: (s) =>
                  toast.success(
                    s.playlist
                      ? `"${s.name}" agora exibe "${s.playlist.name}"`
                      : 'Playlist removida da tela',
                  ),
              },
            )
          }
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0" aria-label="Ações">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onEdit}>
              <Pencil /> Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onRemove}>
              <Unlink /> Desparear
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}

function StatusDot({ online, lastSeenAt }: { online: boolean; lastSeenAt: string | null }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="relative flex size-2.5 shrink-0"
          aria-label={online ? 'Online' : 'Offline'}
        >
          {online && (
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-40" />
          )}
          <span
            className={cn(
              'relative inline-flex size-2.5 rounded-full',
              online ? 'bg-success' : 'bg-muted-foreground/40',
            )}
          />
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {online
          ? 'Online'
          : lastSeenAt
            ? `Offline · visto ${formatRelative(lastSeenAt)}`
            : 'Offline'}
      </TooltipContent>
    </Tooltip>
  );
}

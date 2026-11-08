import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { ArrowLeft, ListPlus, Loader2, MoreHorizontal, Play, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useBlocker, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Media } from '@/features/media/types';
import { usePlaylist, useSavePlaylist } from './api';
import { DeletePlaylistDialog } from './DeletePlaylistDialog';
import { DiscardChangesDialog } from './DiscardChangesDialog';
import { MediaPicker } from './MediaPicker';
import { clampDuration, type DraftItem } from './draft';
import { SortableItem } from './SortableItem';
import type { PlaylistDetail, SavePlaylistInput } from './types';

const DEFAULT_DURATION = 10;

function toDraft(playlist: PlaylistDetail): { name: string; items: DraftItem[] } {
  return {
    name: playlist.name,
    items: playlist.items.map((i) => ({ key: i.id, media: i.media, durationSec: i.durationSec })),
  };
}

function toInput(name: string, items: DraftItem[]): SavePlaylistInput {
  return {
    name: name.trim(),
    items: items.map((i) => ({ mediaId: i.media.id, durationSec: clampDuration(i.durationSec) })),
  };
}

export function PlaylistEditorPage() {
  const { playlistId = '' } = useParams();
  const playlist = usePlaylist(playlistId);

  if (playlist.isPending) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (playlist.isError) {
    return (
      <div className="py-20 text-center">
        <p className="mb-4 text-sm text-muted-foreground">{playlist.error.message}</p>
        <Button variant="outline" asChild>
          <Link to="/playlists">Voltar para playlists</Link>
        </Button>
      </div>
    );
  }
  // key: recomeça o rascunho se a playlist mudar
  return <Editor key={playlist.data.id} playlist={playlist.data} />;
}

function Editor({ playlist }: { playlist: PlaylistDetail }) {
  const navigate = useNavigate();
  const save = useSavePlaylist(playlist.id);
  const [name, setName] = useState(playlist.name);
  const [items, setItems] = useState<DraftItem[]>(() => toDraft(playlist).items);
  const [deleting, setDeleting] = useState(false);

  const saved = useMemo(
    () => JSON.stringify(toInput(playlist.name, toDraft(playlist).items)),
    [playlist],
  );
  const dirty = JSON.stringify(toInput(name, items)) !== saved;
  const canSave = dirty && name.trim().length > 0 && !save.isPending;

  // Avisa antes de sair com alterações não salvas (dentro do app e ao fechar a aba).
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && !save.isPending && currentLocation.pathname !== nextLocation.pathname,
  );
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const handleSave = useCallback(
    (after?: () => void) => {
      if (!name.trim()) {
        toast.error('Dê um nome para a playlist');
        return;
      }
      save.mutate(toInput(name, items), {
        onSuccess: (updated) => {
          // Sincroniza as chaves locais com os ids novos do servidor.
          setItems(toDraft(updated).items);
          setName(updated.name);
          if (after) after();
          else
            toast.success('Playlist salva', {
              description:
                updated.screenCount > 0
                  ? `${updated.screenCount} ${updated.screenCount === 1 ? 'tela atualizada' : 'telas atualizadas'}.`
                  : undefined,
            });
        },
      });
    },
    [items, name, save],
  );

  // Ctrl/Cmd + S salva
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (canSave) handleSave();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [canSave, handleSave]);

  function preview() {
    // Pede tela cheia ainda dentro do clique (o navegador exige um gesto do usuário).
    void document.documentElement.requestFullscreen?.().catch(() => undefined);
    const go = () => void navigate(`/preview/${playlist.id}`);
    if (dirty) handleSave(go);
    else go();
  }

  function addMedia(media: Media) {
    setItems((prev) => [
      ...prev,
      { key: crypto.randomUUID(), media, durationSec: DEFAULT_DURATION },
    ]);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const from = prev.findIndex((i) => i.key === active.id);
      const to = prev.findIndex((i) => i.key === over.id);
      return arrayMove(prev, from, to);
    });
  }

  return (
    <>
      <Link
        to="/playlists"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Playlists
      </Link>

      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          placeholder="Nome da playlist"
          aria-label="Nome da playlist"
          className="min-w-0 flex-1 rounded-md bg-transparent text-2xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring/50"
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={preview} disabled={save.isPending}>
            <Play /> Pré-visualizar
          </Button>
          <Button onClick={() => handleSave()} disabled={!canSave}>
            {save.isPending && <Loader2 className="animate-spin" />}
            {dirty ? 'Salvar' : 'Salvo'}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Mais ações">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(true)}>
                <Trash2 /> Excluir playlist
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section aria-label="Itens da playlist">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center">
              <div className="mb-4 flex size-11 items-center justify-center rounded-full bg-muted">
                <ListPlus className="size-5 text-muted-foreground" />
              </div>
              <p className="max-w-xs text-sm text-muted-foreground">
                Clique nas mídias da biblioteca para adicioná-las à playlist.
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis, restrictToParentElement]}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={items.map((i) => i.key)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="space-y-2">
                  {items.map((item, index) => (
                    <SortableItem
                      key={item.key}
                      item={item}
                      position={index + 1}
                      onDurationChange={(value) =>
                        setItems((prev) =>
                          prev.map((i) => (i.key === item.key ? { ...i, durationSec: value } : i)),
                        )
                      }
                      onRemove={() => setItems((prev) => prev.filter((i) => i.key !== item.key))}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
          {playlist.screenCount > 0 && (
            <p className="mt-4 text-xs text-muted-foreground">
              Exibida em {playlist.screenCount} {playlist.screenCount === 1 ? 'tela' : 'telas'}. Ao
              salvar, elas atualizam na hora.
            </p>
          )}
        </section>

        <aside className="lg:sticky lg:top-8 lg:self-start">
          <MediaPicker onAdd={addMedia} />
        </aside>
      </div>

      <DeletePlaylistDialog
        playlist={deleting ? playlist : null}
        onClose={() => setDeleting(false)}
        onDeleted={() => void navigate('/playlists', { replace: true })}
      />
      <DiscardChangesDialog blocker={blocker} />
    </>
  );
}

import { ListVideo, Loader2, Monitor, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { MediaThumb } from '@/features/media/MediaThumb';
import { usePlaylists } from './api';
import { CreatePlaylistDialog } from './CreatePlaylistDialog';
import { describePlaylist } from './format';

export function PlaylistsPage() {
  const playlists = usePlaylists();
  const [creating, setCreating] = useState(false);

  const newButton = (
    <Button onClick={() => setCreating(true)}>
      <Plus /> Nova playlist
    </Button>
  );

  return (
    <>
      <PageHeader
        title="Playlists"
        description="Sequências de mídias exibidas em loop."
        actions={playlists.data?.length ? newButton : null}
      />

      {playlists.isPending ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : playlists.isError ? (
        <p className="py-20 text-center text-sm text-muted-foreground">
          Não foi possível carregar as playlists.
        </p>
      ) : playlists.data.length === 0 ? (
        <EmptyState icon={ListVideo} title="Nenhuma playlist criada ainda." action={newButton} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {playlists.data.map((p) => (
            <Link
              key={p.id}
              to={`/playlists/${p.id}`}
              className="group overflow-hidden rounded-xl border bg-card shadow-xs outline-none transition-shadow hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="aspect-video overflow-hidden bg-muted">
                {p.cover ? (
                  <MediaThumb
                    media={p.cover}
                    className="transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center">
                    <ListVideo className="size-6 text-muted-foreground/60" />
                  </div>
                )}
              </div>
              <div className="flex items-end justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{describePlaylist(p)}</p>
                </div>
                {p.screenCount > 0 && (
                  <span
                    className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground"
                    title="Telas exibindo esta playlist"
                  >
                    <Monitor className="size-3.5" /> {p.screenCount}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreatePlaylistDialog open={creating} onOpenChange={setCreating} />
    </>
  );
}

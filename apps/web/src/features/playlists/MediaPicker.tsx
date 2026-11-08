import { Loader2, Plus } from 'lucide-react';
import { Link } from 'react-router';
import { useMediaList } from '@/features/media/api';
import { MediaThumb } from '@/features/media/MediaThumb';
import type { Media } from '@/features/media/types';

/** Biblioteca compacta: clique para adicionar ao fim da playlist. */
export function MediaPicker({ onAdd }: { onAdd: (media: Media) => void }) {
  const media = useMediaList();

  return (
    <div className="rounded-xl border bg-card p-4 shadow-xs">
      <p className="mb-3 text-sm font-medium">Biblioteca</p>
      {media.isPending ? (
        <div className="flex justify-center py-8">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        </div>
      ) : !media.data?.length ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Nenhuma mídia ainda.{' '}
          <Link to="/media" className="font-medium text-primary hover:underline">
            Enviar arquivos
          </Link>
        </p>
      ) : (
        <ul className="grid max-h-[calc(100svh-14rem)] grid-cols-2 gap-2 overflow-y-auto pr-1">
          {media.data.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => onAdd(m)}
                className="group relative block w-full overflow-hidden rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                title={`Adicionar ${m.name}`}
              >
                <div className="aspect-video bg-muted">
                  <MediaThumb media={m} />
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  <Plus className="size-5 text-white" />
                </div>
                <p className="truncate px-0.5 pt-1 text-xs text-muted-foreground">{m.name}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

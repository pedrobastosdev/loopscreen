import { Film, Loader2, Upload } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { useMediaList, useUploadLimits } from './api';
import { DeleteMediaDialog } from './DeleteMediaDialog';
import { MediaCard } from './MediaCard';
import { RenameMediaDialog } from './RenameMediaDialog';
import type { Media } from './types';
import { UploadPanel } from './UploadPanel';
import { useFileDrop } from './useFileDrop';
import { useUploadQueue } from './useUploadQueue';

const FALLBACK_ACCEPT = 'image/jpeg,image/png,image/webp,video/mp4,video/webm';

export function MediaPage() {
  const media = useMediaList();
  const limits = useUploadLimits();
  const { tasks, enqueue, clearFinished } = useUploadQueue();
  const inputRef = useRef<HTMLInputElement>(null);
  const [renaming, setRenaming] = useState<Media | null>(null);
  const [deleting, setDeleting] = useState<Media | null>(null);

  const accept = limits.data?.mimeTypes.join(',') ?? FALLBACK_ACCEPT;

  /** Pré-validação no navegador (o servidor valida de novo pelos magic bytes). */
  const handleFiles = useCallback(
    (files: File[]) => {
      const mimeTypes = limits.data?.mimeTypes ?? FALLBACK_ACCEPT.split(',');
      const maxBytes = (limits.data?.maxUploadMb ?? 100) * 1024 * 1024;
      const valid: File[] = [];
      for (const file of files) {
        if (!mimeTypes.includes(file.type)) {
          toast.error(`"${file.name}" não é um formato aceito`, {
            description: 'Use JPG, PNG, WEBP, MP4 ou WEBM.',
          });
        } else if (file.size > maxBytes) {
          toast.error(`"${file.name}" é muito grande`, {
            description: `O limite é ${limits.data?.maxUploadMb ?? 100} MB por arquivo.`,
          });
        } else {
          valid.push(file);
        }
      }
      if (valid.length) enqueue(valid);
    },
    [enqueue, limits.data],
  );

  const dragging = useFileDrop(handleFiles);
  const openPicker = () => inputRef.current?.click();

  return (
    <>
      <PageHeader
        title="Mídias"
        description="Imagens e vídeos disponíveis para as playlists."
        actions={
          media.data?.length ? (
            <Button onClick={openPicker}>
              <Upload /> Enviar arquivos
            </Button>
          ) : null
        }
      />

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={(e) => {
          handleFiles(Array.from(e.target.files ?? []));
          e.target.value = '';
        }}
      />

      {media.isPending ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : media.isError ? (
        <p className="py-20 text-center text-sm text-muted-foreground">
          Não foi possível carregar as mídias.
        </p>
      ) : media.data.length === 0 ? (
        <EmptyState
          icon={Film}
          title="Arraste imagens ou vídeos para cá, ou escolha arquivos do computador."
          action={
            <Button onClick={openPicker}>
              <Upload /> Enviar arquivos
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {media.data.map((item) => (
            <MediaCard
              key={item.id}
              media={item}
              onRename={() => setRenaming(item)}
              onDelete={() => setDeleting(item)}
            />
          ))}
        </div>
      )}

      {dragging && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-6 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-primary px-16 py-12 text-center">
            <Upload className="size-6 text-primary" />
            <p className="text-sm font-medium">Solte os arquivos para enviar</p>
          </div>
        </div>
      )}

      <UploadPanel tasks={tasks} onClose={clearFinished} />
      <RenameMediaDialog media={renaming} onClose={() => setRenaming(null)} />
      <DeleteMediaDialog media={deleting} onClose={() => setDeleting(null)} />
    </>
  );
}

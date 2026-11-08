import { ImageOff } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { Media } from './types';

/** Miniatura: a própria imagem ou o primeiro frame do vídeo (sem processamento no servidor). */
export function MediaThumb({
  media,
  className,
}: {
  media: Pick<Media, 'type' | 'url' | 'name'>;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const base = cn('size-full object-cover', className);

  if (failed) {
    return (
      <div className={cn('flex size-full items-center justify-center bg-muted', className)}>
        <ImageOff className="size-5 text-muted-foreground" />
      </div>
    );
  }

  if (media.type === 'VIDEO') {
    return (
      <video
        src={`${media.url}#t=0.1`}
        className={base}
        preload="metadata"
        muted
        playsInline
        onError={() => setFailed(true)}
        aria-label={media.name}
      />
    );
  }

  return (
    <img
      src={media.url}
      alt={media.name}
      className={base}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

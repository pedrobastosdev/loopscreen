import { Film, Image as ImageIcon, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatBytes } from '@/lib/format';
import { MediaThumb } from './MediaThumb';
import type { Media } from './types';

export function MediaCard({
  media,
  onRename,
  onDelete,
}: {
  media: Media;
  onRename: () => void;
  onDelete: () => void;
}) {
  const TypeIcon = media.type === 'VIDEO' ? Film : ImageIcon;

  return (
    <div className="group overflow-hidden rounded-xl border bg-card shadow-xs transition-shadow hover:shadow-sm">
      <a
        href={media.url}
        target="_blank"
        rel="noreferrer"
        className="relative block aspect-video overflow-hidden bg-muted"
        title="Abrir em nova aba"
      >
        <MediaThumb
          media={media}
          className="transition-transform duration-300 group-hover:scale-[1.02]"
        />
        {media.usageCount > 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-background/85 px-2 py-0.5 text-[11px] font-medium backdrop-blur">
            Em uso
          </span>
        )}
      </a>
      <div className="flex items-center gap-2 p-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium" title={media.name}>
            {media.name}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <TypeIcon className="size-3.5" />
            {media.type === 'VIDEO' ? 'Vídeo' : 'Imagem'} · {formatBytes(media.size)}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 shrink-0" aria-label="Ações">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onRename}>
              <Pencil /> Renomear
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              <Trash2 /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

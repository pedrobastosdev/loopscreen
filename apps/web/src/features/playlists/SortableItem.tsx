import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MediaThumb } from '@/features/media/MediaThumb';
import { cn } from '@/lib/utils';
import { clampDuration, type DraftItem } from './draft';

export function SortableItem({
  item,
  position,
  onDurationChange,
  onRemove,
}: {
  item: DraftItem;
  position: number;
  onDurationChange: (value: number) => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.key });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        'flex items-center gap-3 rounded-xl border bg-card p-2 pr-3 shadow-xs',
        isDragging && 'relative z-10 shadow-lg ring-2 ring-primary/40',
      )}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        className="flex h-10 w-6 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
        aria-label={`Mover ${item.media.name}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <span className="w-5 text-right text-xs tabular-nums text-muted-foreground">{position}</span>
      <div className="aspect-video w-24 shrink-0 overflow-hidden rounded-md bg-muted">
        <MediaThumb media={item.media} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.media.name}</p>
        <p className="text-xs text-muted-foreground">
          {item.media.type === 'VIDEO' ? 'Vídeo' : 'Imagem'}
        </p>
      </div>
      {item.media.type === 'IMAGE' ? (
        <label className="flex items-center gap-1.5 text-sm">
          <input
            type="number"
            min={1}
            max={3600}
            value={item.durationSec}
            onChange={(e) => onDurationChange(Number(e.target.value))}
            onBlur={(e) => onDurationChange(clampDuration(Number(e.target.value)))}
            className="h-8 w-16 rounded-md border bg-transparent px-2 text-right tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Duração de ${item.media.name} em segundos`}
          />
          <span className="text-muted-foreground">s</span>
        </label>
      ) : (
        <span className="text-xs text-muted-foreground">até o fim</span>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="size-8 shrink-0 text-muted-foreground"
        onClick={onRemove}
        aria-label={`Remover ${item.media.name}`}
      >
        <X />
      </Button>
    </li>
  );
}

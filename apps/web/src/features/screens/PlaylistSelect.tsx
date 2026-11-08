import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePlaylists } from '@/features/playlists/api';
import { cn } from '@/lib/utils';

const NONE = '__none__';

export function PlaylistSelect({
  value,
  onChange,
  disabled,
  className,
  id,
}: {
  value: string | null;
  onChange: (playlistId: string | null) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}) {
  const playlists = usePlaylists();

  return (
    <Select
      value={value ?? NONE}
      onValueChange={(v) => onChange(v === NONE ? null : v)}
      disabled={disabled || playlists.isPending}
    >
      <SelectTrigger id={id} className={cn('w-full', className)} aria-label="Playlist">
        <SelectValue placeholder="Sem playlist" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>
          <span className="text-muted-foreground">Sem playlist</span>
        </SelectItem>
        {playlists.data && playlists.data.length > 0 && <SelectSeparator />}
        {playlists.data?.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

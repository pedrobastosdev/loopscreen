import { type FormEvent, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useRenameMedia } from './api';
import type { Media } from './types';

export function RenameMediaDialog({
  media,
  onClose,
}: {
  media: Media | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={media !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {/* key reinicia o formulário a cada mídia */}
        {media && <RenameForm key={media.id} media={media} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function RenameForm({ media, onClose }: { media: Media; onClose: () => void }) {
  const [name, setName] = useState(media.name);
  const rename = useRenameMedia();
  const trimmed = name.trim();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trimmed || trimmed === media.name) return onClose();
    rename.mutate(
      { id: media.id, name: trimmed },
      {
        onSuccess: () => {
          toast.success('Mídia renomeada');
          onClose();
        },
      },
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Renomear mídia</DialogTitle>
      </DialogHeader>
      <Input
        className="my-5"
        value={name}
        maxLength={120}
        autoFocus
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => setName(e.target.value)}
        aria-label="Nome"
      />
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!trimmed || rename.isPending}>
          Salvar
        </Button>
      </DialogFooter>
    </form>
  );
}

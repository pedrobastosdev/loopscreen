import { type FormEvent, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePairScreen } from './api';
import { PlaylistSelect } from './PlaylistSelect';

export function PairScreenDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && <PairForm onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function PairForm({ onDone }: { onDone: () => void }) {
  const pair = usePairScreen();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [playlistId, setPlaylistId] = useState<string | null>(null);
  const valid = code.length === 6 && name.trim().length > 0;
  const playerUrl = `${window.location.origin}/player`;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid) return;
    pair.mutate(
      { code, name: name.trim(), location: location.trim() || null, playlistId },
      {
        onSuccess: (screen) => {
          toast.success(`"${screen.name}" pareada`);
          onDone();
        },
      },
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Adicionar tela</DialogTitle>
        <DialogDescription>
          Abra <span className="font-medium text-foreground">{playerUrl}</span> no navegador da tela
          e digite o código exibido.
        </DialogDescription>
      </DialogHeader>

      <div className="my-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pair-code">Código</Label>
          <Input
            id="pair-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            placeholder="000000"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="h-14 text-center font-mono text-3xl tracking-[0.5em] md:text-3xl placeholder:text-muted-foreground/40"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pair-name">Nome</Label>
          <Input
            id="pair-name"
            placeholder="Ex.: TV da vitrine"
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pair-location">
            Local <span className="font-normal text-muted-foreground">(opcional)</span>
          </Label>
          <Input
            id="pair-location"
            placeholder="Ex.: Loja centro"
            maxLength={80}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pair-playlist">Playlist</Label>
          <PlaylistSelect id="pair-playlist" value={playlistId} onChange={setPlaylistId} />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!valid || pair.isPending}>
          Parear
        </Button>
      </DialogFooter>
    </form>
  );
}

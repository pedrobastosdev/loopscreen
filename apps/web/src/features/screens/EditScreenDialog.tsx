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
import { Label } from '@/components/ui/label';
import { useUpdateScreen } from './api';
import type { Screen } from './types';

export function EditScreenDialog({
  screen,
  onClose,
}: {
  screen: Screen | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={screen !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {screen && <EditForm key={screen.id} screen={screen} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function EditForm({ screen, onClose }: { screen: Screen; onClose: () => void }) {
  const update = useUpdateScreen();
  const [name, setName] = useState(screen.name);
  const [location, setLocation] = useState(screen.location ?? '');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    update.mutate(
      { id: screen.id, name: name.trim(), location: location.trim() || null },
      {
        onSuccess: () => {
          toast.success('Tela atualizada');
          onClose();
        },
      },
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Editar tela</DialogTitle>
      </DialogHeader>
      <div className="my-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="edit-name">Nome</Label>
          <Input
            id="edit-name"
            value={name}
            maxLength={60}
            autoFocus
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-location">
            Local <span className="font-normal text-muted-foreground">(opcional)</span>
          </Label>
          <Input
            id="edit-location"
            value={location}
            maxLength={80}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!name.trim() || update.isPending}>
          Salvar
        </Button>
      </DialogFooter>
    </form>
  );
}

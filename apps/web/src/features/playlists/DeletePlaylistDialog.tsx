import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button';
import { useDeletePlaylist } from './api';

export function DeletePlaylistDialog({
  playlist,
  onClose,
  onDeleted,
}: {
  playlist: { id: string; name: string; screenCount: number } | null;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const remove = useDeletePlaylist();

  return (
    <AlertDialog open={playlist !== null} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir playlist?</AlertDialogTitle>
          <AlertDialogDescription>
            "{playlist?.name}" será excluída.
            {playlist &&
              playlist.screenCount > 0 &&
              ` ${playlist.screenCount} ${playlist.screenCount === 1 ? 'tela ficará' : 'telas ficarão'} sem playlist.`}{' '}
            As mídias continuam na biblioteca.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: 'destructive' })}
            disabled={remove.isPending}
            onClick={() => {
              if (!playlist) return;
              remove.mutate(playlist.id, {
                onSuccess: () => {
                  toast.success('Playlist excluída');
                  onDeleted();
                },
              });
            }}
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

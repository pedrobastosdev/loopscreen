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
import { useDeleteMedia } from './api';
import type { Media } from './types';

export function DeleteMediaDialog({
  media,
  onClose,
}: {
  media: Media | null;
  onClose: () => void;
}) {
  const remove = useDeleteMedia();
  const inUse = (media?.usageCount ?? 0) > 0;

  return (
    <AlertDialog open={media !== null} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{inUse ? 'Mídia em uso' : 'Excluir mídia?'}</AlertDialogTitle>
          <AlertDialogDescription>
            {inUse
              ? `"${media?.name}" está em uma ou mais playlists. Remova-a das playlists antes de excluir.`
              : `"${media?.name}" será excluída permanentemente.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{inUse ? 'Entendi' : 'Cancelar'}</AlertDialogCancel>
          {!inUse && (
            <AlertDialogAction
              className={buttonVariants({ variant: 'destructive' })}
              disabled={remove.isPending}
              onClick={() => {
                if (!media) return;
                // O servidor também valida: se a mídia entrou numa playlist nesse
                // meio-tempo, o 409 aparece como toast (onError global).
                remove.mutate(media.id, { onSuccess: () => toast.success('Mídia excluída') });
              }}
            >
              Excluir
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

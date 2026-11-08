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
import { useRemoveScreen } from './api';
import type { Screen } from './types';

export function RemoveScreenDialog({
  screen,
  onClose,
}: {
  screen: Screen | null;
  onClose: () => void;
}) {
  const remove = useRemoveScreen();

  return (
    <AlertDialog open={screen !== null} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover tela?</AlertDialogTitle>
          <AlertDialogDescription>
            "{screen?.name}" será despareada e voltará a exibir um código de pareamento.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: 'destructive' })}
            disabled={remove.isPending}
            onClick={() => {
              if (!screen) return;
              remove.mutate(screen.id, { onSuccess: () => toast.success('Tela removida') });
            }}
          >
            Remover
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

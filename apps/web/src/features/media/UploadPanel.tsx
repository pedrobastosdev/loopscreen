import { CheckCircle2, CircleAlert, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { UploadTask } from './useUploadQueue';

/** Painel discreto no canto com o progresso de cada envio. */
export function UploadPanel({ tasks, onClose }: { tasks: UploadTask[]; onClose: () => void }) {
  if (tasks.length === 0) return null;
  const active = tasks.filter((t) => t.status === 'queued' || t.status === 'uploading').length;

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border bg-popover shadow-lg">
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <p className="text-sm font-medium">
          {active > 0 ? `Enviando ${active} arquivo${active > 1 ? 's' : ''}…` : 'Envios concluídos'}
        </p>
        {active === 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={onClose}
            aria-label="Fechar"
          >
            <X />
          </Button>
        )}
      </div>
      <ul className="max-h-64 divide-y overflow-y-auto">
        {tasks.map((task) => (
          <li key={task.id} className="space-y-1.5 px-4 py-2.5">
            <div className="flex items-center gap-2 text-sm">
              {task.status === 'done' && <CheckCircle2 className="size-4 shrink-0 text-success" />}
              {task.status === 'error' && (
                <CircleAlert className="size-4 shrink-0 text-destructive" />
              )}
              {(task.status === 'uploading' || task.status === 'queued') && (
                <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
              )}
              <span className="truncate">{task.name}</span>
            </div>
            {task.status === 'error' ? (
              <p className="text-xs text-destructive">{task.error}</p>
            ) : (
              task.status !== 'done' && <Progress value={task.progress} className="h-1" />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

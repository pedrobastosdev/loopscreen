import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '@/lib/api';
import { mediaKeys, uploadMedia } from './api';

export interface UploadTask {
  id: string;
  name: string;
  progress: number;
  status: 'queued' | 'uploading' | 'done' | 'error';
  error?: string;
}

const CONCURRENCY = 2;

/** Fila de uploads: um arquivo por requisição, para ter progresso individual. */
export function useUploadQueue() {
  const queryClient = useQueryClient();
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  // A fila vive em refs (fora do render) para não disparar envios duplicados.
  const pending = useRef<{ id: string; file: File }[]>([]);
  const running = useRef(0);

  const update = useCallback((id: string, patch: Partial<UploadTask>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const pump = useCallback(
    function run(): void {
      while (running.current < CONCURRENCY && pending.current.length > 0) {
        const next = pending.current.shift();
        if (!next) break;
        running.current++;
        update(next.id, { status: 'uploading' });

        uploadMedia(next.file, (progress) => update(next.id, { progress }))
          .then(() => {
            update(next.id, { status: 'done', progress: 100 });
            void queryClient.invalidateQueries({ queryKey: mediaKeys.all });
          })
          .catch((error: unknown) => {
            update(next.id, {
              status: 'error',
              error: error instanceof ApiError ? error.message : 'Falha no envio',
            });
          })
          .finally(() => {
            running.current--;
            run();
          });
      }
    },
    [queryClient, update],
  );

  const enqueue = useCallback(
    (files: File[]) => {
      const items = files.map((file) => ({ id: crypto.randomUUID(), file }));
      setTasks((prev) => [
        ...prev,
        ...items.map(({ id, file }) => ({
          id,
          name: file.name,
          progress: 0,
          status: 'queued' as const,
        })),
      ]);
      pending.current.push(...items);
      pump();
    },
    [pump],
  );

  const clearFinished = useCallback(() => {
    setTasks((prev) => prev.filter((t) => t.status === 'queued' || t.status === 'uploading'));
  }, []);

  // O painel some sozinho alguns segundos depois que tudo terminou com sucesso.
  useEffect(() => {
    if (tasks.length === 0 || !tasks.every((t) => t.status === 'done')) return;
    const timer = setTimeout(clearFinished, 4000);
    return () => clearTimeout(timer);
  }, [tasks, clearFinished]);

  return { tasks, enqueue, clearFinished };
}

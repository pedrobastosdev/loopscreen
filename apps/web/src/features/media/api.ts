import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError, UNAUTHORIZED_EVENT } from '@/lib/api';
import { tokenStorage } from '@/lib/token-storage';
import type { Media, UploadLimits } from './types';

export const mediaKeys = {
  all: ['media'] as const,
  limits: ['media', 'limits'] as const,
};

export function useMediaList() {
  return useQuery({ queryKey: mediaKeys.all, queryFn: () => api<Media[]>('/media') });
}

export function useUploadLimits() {
  return useQuery({
    queryKey: mediaKeys.limits,
    queryFn: () => api<UploadLimits>('/media/limits'),
    staleTime: Infinity,
  });
}

export function useRenameMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      api<Media>(`/media/${id}`, { method: 'PATCH', body: { name } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mediaKeys.all }),
  });
}

export function useDeleteMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/media/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mediaKeys.all }),
  });
}

/**
 * Upload de um arquivo com progresso. Usa XMLHttpRequest porque o fetch
 * ainda não expõe progresso de envio.
 */
export function uploadMedia(
  file: File,
  onProgress: (percent: number) => void,
  signal?: AbortSignal,
): Promise<Media[]> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/media');
    xhr.responseType = 'json';
    const token = tokenStorage.get();
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      const body = xhr.response as { message?: string | string[] } | Media[] | null;
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(body as Media[]);
        return;
      }
      if (xhr.status === 401) window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
      const message =
        body && !Array.isArray(body) && body.message
          ? [body.message].flat().join('. ')
          : 'Falha no envio';
      reject(new ApiError(xhr.status, message, body));
    };
    xhr.onerror = () => reject(new ApiError(0, 'Sem conexão com o servidor'));
    xhr.onabort = () => reject(new DOMException('Envio cancelado', 'AbortError'));
    signal?.addEventListener('abort', () => xhr.abort());

    const form = new FormData();
    form.append('files', file);
    xhr.send(form);
  });
}

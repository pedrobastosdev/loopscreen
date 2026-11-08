import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { playlistKeys } from '@/features/playlists/api';
import { api } from '@/lib/api';
import type { PairScreenInput, Screen, UpdateScreenInput } from './types';

export const screenKeys = { all: ['screens'] as const };

export function useScreens() {
  return useQuery({
    queryKey: screenKeys.all,
    queryFn: () => api<Screen[]>('/screens'),
    // Atualiza o "visto por último" mesmo sem eventos em tempo real.
    refetchInterval: 30_000,
  });
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: screenKeys.all });
    // Contagem de telas por playlist
    void queryClient.invalidateQueries({ queryKey: playlistKeys.all, exact: true });
  };
}

export function usePairScreen() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: PairScreenInput) =>
      api<Screen>('/screens/pair', { method: 'POST', body: input }),
    onSuccess: invalidate,
  });
}

export function useUpdateScreen() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateScreenInput & { id: string }) =>
      api<Screen>(`/screens/${id}`, { method: 'PATCH', body: input }),
    onSuccess: (screen) => {
      // Atualização imediata da linha, sem esperar o refetch.
      queryClient.setQueryData<Screen[]>(screenKeys.all, (prev) =>
        prev?.map((s) => (s.id === screen.id ? screen : s)),
      );
      invalidate();
    },
  });
}

export function useRemoveScreen() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/screens/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });
}

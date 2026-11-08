import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mediaKeys } from '@/features/media/api';
import { api } from '@/lib/api';
import type { PlaylistDetail, PlaylistSummary, SavePlaylistInput } from './types';

export const playlistKeys = {
  all: ['playlists'] as const,
  detail: (id: string) => ['playlists', id] as const,
};

export function usePlaylists() {
  return useQuery({
    queryKey: playlistKeys.all,
    queryFn: () => api<PlaylistSummary[]>('/playlists'),
  });
}

export function usePlaylist(id: string) {
  return useQuery({
    queryKey: playlistKeys.detail(id),
    queryFn: () => api<PlaylistDetail>(`/playlists/${id}`),
  });
}

export function useCreatePlaylist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api<PlaylistDetail>('/playlists', { method: 'POST', body: { name } }),
    onSuccess: (playlist) => {
      queryClient.setQueryData(playlistKeys.detail(playlist.id), playlist);
      void queryClient.invalidateQueries({ queryKey: playlistKeys.all, exact: true });
    },
  });
}

export function useSavePlaylist(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SavePlaylistInput) =>
      api<PlaylistDetail>(`/playlists/${id}`, { method: 'PUT', body: input }),
    onSuccess: (playlist) => {
      queryClient.setQueryData(playlistKeys.detail(id), playlist);
      void queryClient.invalidateQueries({ queryKey: playlistKeys.all, exact: true });
      // "Em uso" das mídias pode ter mudado
      void queryClient.invalidateQueries({ queryKey: mediaKeys.all });
    },
  });
}

export function useDeletePlaylist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/playlists/${id}`, { method: 'DELETE' }),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: playlistKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: playlistKeys.all, exact: true });
      void queryClient.invalidateQueries({ queryKey: mediaKeys.all });
    },
  });
}

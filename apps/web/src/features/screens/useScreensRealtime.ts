import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuth } from '@/features/auth/auth-context';
import { connectSocket, type ScreenStatusPayload, SocketEvents } from '@/lib/socket';
import { tokenStorage } from '@/lib/token-storage';
import { screenKeys } from './api';
import type { Screen } from './types';

/** Mantém a lista de telas (bolinhas online/offline) atualizada sem refresh. */
export function useScreensRealtime() {
  const { status } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = tokenStorage.get();
    if (status !== 'authenticated' || !token) return;

    const socket = connectSocket({ token });
    const resync = () => void queryClient.invalidateQueries({ queryKey: screenKeys.all });

    socket.on(SocketEvents.ScreenStatus, (payload: ScreenStatusPayload) => {
      queryClient.setQueryData<Screen[]>(screenKeys.all, (prev) =>
        prev?.map((s) =>
          s.id === payload.screenId
            ? { ...s, online: payload.online, lastSeenAt: payload.lastSeenAt ?? s.lastSeenAt }
            : s,
        ),
      );
    });
    socket.on(SocketEvents.ScreensChanged, resync);
    // Depois de uma queda, sincroniza o que pode ter mudado.
    socket.io.on('reconnect', resync);

    return () => {
      socket.disconnect();
    };
  }, [status, queryClient]);
}

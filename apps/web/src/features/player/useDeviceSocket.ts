import { useEffect, useRef } from 'react';
import { connectSocket, SocketEvents } from '@/lib/socket';

const HEARTBEAT_MS = 30_000;

/**
 * Conexão em tempo real do player: recebe pareamento, atualizações de
 * playlist e desparear, e envia heartbeat a cada 30s.
 */
export function useDeviceSocket(
  deviceToken: string | null,
  handlers: { onSync: () => void; onUnpaired: () => void },
) {
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    if (!deviceToken) return;
    const socket = connectSocket({ deviceToken });
    const sync = () => handlersRef.current.onSync();

    socket.on(SocketEvents.ScreenPaired, sync);
    socket.on(SocketEvents.PlaylistUpdated, sync);
    socket.on(SocketEvents.ScreenUnpaired, () => handlersRef.current.onUnpaired());
    // Reconectou depois de uma queda: pode ter perdido eventos.
    socket.io.on('reconnect', sync);
    socket.on('disconnect', (reason) => {
      // O servidor recusou/encerrou a conexão (ex.: token inválido): a sincronização
      // via HTTP decide o que fazer (registrar de novo, se for o caso).
      if (reason === 'io server disconnect') sync();
    });

    const heartbeat = window.setInterval(() => {
      if (socket.connected) socket.emit(SocketEvents.Heartbeat);
    }, HEARTBEAT_MS);

    return () => {
      window.clearInterval(heartbeat);
      socket.disconnect();
    };
  }, [deviceToken]);
}

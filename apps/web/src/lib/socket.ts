import { io, type Socket } from 'socket.io-client';

/** Mesmos nomes usados pela API (apps/api/src/realtime/events.ts). */
export const SocketEvents = {
  ScreenPaired: 'screen:paired',
  PlaylistUpdated: 'playlist:updated',
  ScreenUnpaired: 'screen:unpaired',
  Heartbeat: 'heartbeat',
  ScreenStatus: 'screen:status',
  ScreensChanged: 'screens:changed',
} as const;

export interface ScreenStatusPayload {
  screenId: string;
  online: boolean;
  lastSeenAt: string | null;
}

/** Socket.IO na mesma origem; reconexão automática com backoff. */
export function connectSocket(auth: { token: string } | { deviceToken: string }): Socket {
  return io({
    path: '/socket.io',
    auth,
    reconnection: true,
    reconnectionDelay: 1_000,
    reconnectionDelayMax: 15_000,
  });
}

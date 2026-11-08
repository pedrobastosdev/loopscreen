/** Nomes dos eventos do Socket.IO (compartilhados conceitualmente com o front). */
export const SocketEvents = {
  /** servidor → player: a tela foi pareada */
  ScreenPaired: 'screen:paired',
  /** servidor → player: o conteúdo a exibir mudou (buscar o manifest de novo) */
  PlaylistUpdated: 'playlist:updated',
  /** servidor → player: a tela foi removida no painel */
  ScreenUnpaired: 'screen:unpaired',
  /** player → servidor: sinal de vida a cada 30s */
  Heartbeat: 'heartbeat',
  /** servidor → painel: mudança de online/offline */
  ScreenStatus: 'screen:status',
  /** servidor → painel: lista de telas mudou (pareamento, remoção) */
  ScreensChanged: 'screens:changed',
} as const;

export const ADMINS_ROOM = 'admins';
export const screenRoom = (screenId: string) => `screen:${screenId}`;

export interface ScreenStatusPayload {
  screenId: string;
  online: boolean;
  lastSeenAt: string | null;
}

/** Dados anexados ao socket depois da autenticação no handshake. */
export type SocketIdentity =
  { kind: 'device'; screenId: string } | { kind: 'admin'; userId: string };

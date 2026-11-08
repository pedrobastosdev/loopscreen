import { Injectable, Logger } from '@nestjs/common';
import type { Server } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service.js';
import { ADMINS_ROOM, screenRoom, type ScreenStatusPayload, SocketEvents } from './events.js';

/**
 * Ponto único para avisar telas e painel sobre mudanças. Os serviços de
 * domínio chamam estes métodos sem conhecer o Socket.IO.
 */
@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);
  private server: Server | null = null;

  constructor(private readonly prisma: PrismaService) {}

  /** Chamado pelo gateway quando o servidor Socket.IO sobe. */
  attach(server: Server): void {
    this.server = server;
  }

  screenPaired(screenId: string): void {
    this.server?.to(screenRoom(screenId)).emit(SocketEvents.ScreenPaired);
    this.screensChanged();
  }

  screenUnpaired(screenId: string): void {
    if (!this.server) return;
    const room = screenRoom(screenId);
    this.server.to(room).emit(SocketEvents.ScreenUnpaired);
    // O token deixou de existir: encerra as conexões dessa tela.
    this.server.in(room).disconnectSockets(true);
    this.screensChanged();
  }

  /** A playlist atribuída à tela mudou. */
  screenPlaylistChanged(screenId: string): void {
    this.notifyScreens([screenId]);
  }

  /** O conteúdo de uma playlist mudou: avisa todas as telas que a exibem. */
  async playlistUpdated(playlistId: string): Promise<void> {
    if (!this.server) return;
    const screens = await this.prisma.screen.findMany({
      where: { playlistId, pairedAt: { not: null } },
      select: { id: true },
    });
    this.notifyScreens(screens.map((s) => s.id));
  }

  notifyScreens(screenIds: string[]): void {
    for (const id of screenIds) {
      this.server?.to(screenRoom(id)).emit(SocketEvents.PlaylistUpdated);
    }
    if (screenIds.length) this.logger.debug(`playlist:updated → ${screenIds.length} tela(s)`);
  }

  screenStatus(payload: ScreenStatusPayload): void {
    this.server?.to(ADMINS_ROOM).emit(SocketEvents.ScreenStatus, payload);
  }

  screensChanged(): void {
    this.server?.to(ADMINS_ROOM).emit(SocketEvents.ScreensChanged);
  }
}

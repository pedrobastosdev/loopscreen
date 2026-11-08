import { Injectable, Logger } from '@nestjs/common';

/**
 * Ponto único para avisar telas e painel sobre mudanças. Nesta etapa só
 * registra os eventos; na etapa de tempo real passa a emitir via Socket.IO.
 */
@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);

  screenPaired(screenId: string): void {
    this.logger.debug(`screen:paired ${screenId}`);
  }

  screenUnpaired(screenId: string): void {
    this.logger.debug(`screen:unpaired ${screenId}`);
  }

  /** A playlist atribuída à tela mudou. */
  screenPlaylistChanged(screenId: string): void {
    this.logger.debug(`playlist:updated (tela) ${screenId}`);
  }

  /** O conteúdo de uma playlist mudou. */
  playlistUpdated(playlistId: string): void {
    this.logger.debug(`playlist:updated ${playlistId}`);
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { Prisma, type Screen } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  generateDeviceToken,
  generatePairingCode,
  hashDeviceToken,
  PAIRING_CODE_TTL_MS,
  UNPAIRED_SCREEN_TTL_MS,
} from './device-token.js';

const MAX_CODE_ATTEMPTS = 8;
/** Evita escrever lastSeenAt a cada requisição do mesmo player. */
const LAST_SEEN_WRITE_INTERVAL_MS = 15_000;

export interface PairingInfo {
  pairingCode: string;
  expiresAt: Date;
}

@Injectable()
export class DevicesService {
  private readonly logger = new Logger(DevicesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Cria um dispositivo não pareado. O token em texto puro só sai nesta resposta. */
  async register(): Promise<PairingInfo & { deviceToken: string }> {
    const deviceToken = generateDeviceToken();
    const deviceTokenHash = hashDeviceToken(deviceToken);

    const screen = await this.withFreshCode((pairing) =>
      this.prisma.screen.create({
        data: {
          deviceTokenHash,
          lastSeenAt: new Date(),
          pairingCode: pairing.pairingCode,
          pairingExpiresAt: pairing.expiresAt,
        },
      }),
    );

    return {
      deviceToken,
      pairingCode: screen.pairingCode ?? '',
      expiresAt: screen.pairingExpiresAt ?? new Date(),
    };
  }

  /** Encontra a tela pelo token (comparando hashes). */
  findByToken(token: string): Promise<Screen | null> {
    return this.prisma.screen.findUnique({ where: { deviceTokenHash: hashDeviceToken(token) } });
  }

  /** Gera um novo código para uma tela ainda não pareada cujo código expirou. */
  async renewPairingCode(screen: Screen): Promise<PairingInfo> {
    if (
      screen.pairingCode &&
      screen.pairingExpiresAt &&
      screen.pairingExpiresAt.getTime() > Date.now()
    ) {
      return { pairingCode: screen.pairingCode, expiresAt: screen.pairingExpiresAt };
    }
    const updated = await this.withFreshCode((pairing) =>
      this.prisma.screen.update({
        where: { id: screen.id },
        data: { pairingCode: pairing.pairingCode, pairingExpiresAt: pairing.expiresAt },
      }),
    );
    return {
      pairingCode: updated.pairingCode ?? '',
      expiresAt: updated.pairingExpiresAt ?? new Date(),
    };
  }

  async touch(screen: Screen): Promise<Date> {
    const now = new Date();
    if (
      screen.lastSeenAt &&
      now.getTime() - screen.lastSeenAt.getTime() < LAST_SEEN_WRITE_INTERVAL_MS
    ) {
      return screen.lastSeenAt;
    }
    await this.prisma.screen.update({ where: { id: screen.id }, data: { lastSeenAt: now } });
    return now;
  }

  /** Remove dispositivos que nunca foram pareados (a cada 10 minutos). */
  @Interval(10 * 60 * 1000)
  async purgeUnpaired(): Promise<number> {
    const { count } = await this.prisma.screen.deleteMany({
      where: { pairedAt: null, createdAt: { lt: new Date(Date.now() - UNPAIRED_SCREEN_TTL_MS) } },
    });
    if (count > 0) this.logger.log(`${count} dispositivo(s) não pareado(s) removido(s)`);
    return count;
  }

  /**
   * Executa a escrita com um código novo. Códigos expirados liberam o valor
   * (a coluna é única) e colisões com códigos ativos tentam outro número.
   */
  private async withFreshCode(write: (pairing: PairingInfo) => Promise<Screen>): Promise<Screen> {
    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
      const pairing = {
        pairingCode: generatePairingCode(),
        expiresAt: new Date(Date.now() + PAIRING_CODE_TTL_MS),
      };
      await this.prisma.screen.updateMany({
        where: { pairingCode: pairing.pairingCode, pairingExpiresAt: { lt: new Date() } },
        data: { pairingCode: null, pairingExpiresAt: null },
      });
      try {
        return await write(pairing);
      } catch (error) {
        const collision =
          error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
        if (!collision) throw error;
      }
    }
    throw new Error('Não foi possível gerar um código de pareamento');
  }
}

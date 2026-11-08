import { ConflictException, Injectable } from '@nestjs/common';
import { DevicesService } from '../devices/devices.service.js';
import type { Screen } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';
import { buildManifest, type Manifest } from './manifest.js';

export type PlayerStatus =
  | { paired: false; pairingCode: string; expiresAt: Date }
  | { paired: true; screen: { id: string; name: string } };

export type PlayerManifest = Manifest & {
  screen: { id: string; name: string; location: string | null };
};

@Injectable()
export class PlayerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly devices: DevicesService,
    private readonly storage: StorageService,
  ) {}

  /** Estado do dispositivo: código de pareamento (renovado se expirou) ou a tela pareada. */
  async status(device: Screen): Promise<PlayerStatus> {
    await this.devices.touch(device);
    if (!device.pairedAt) {
      return { paired: false, ...(await this.devices.renewPairingCode(device)) };
    }
    return { paired: true, screen: { id: device.id, name: device.name ?? 'Tela' } };
  }

  async manifest(device: Screen): Promise<PlayerManifest> {
    if (!device.pairedAt) throw new ConflictException('Tela ainda não pareada');
    await this.devices.touch(device);

    const playlist = device.playlistId
      ? await this.prisma.playlist.findUnique({
          where: { id: device.playlistId },
          include: { items: { include: { media: true } } },
        })
      : null;

    return {
      screen: { id: device.id, name: device.name ?? 'Tela', location: device.location },
      ...buildManifest(playlist, (key) => this.storage.publicUrl(key)),
    };
  }
}

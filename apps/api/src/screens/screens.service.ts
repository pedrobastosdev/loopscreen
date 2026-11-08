import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ONLINE_THRESHOLD_MS } from '../devices/device-token.js';
import type { Playlist, Screen } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RealtimeService } from '../realtime/realtime.service.js';
import type { PairScreenDto, ScreenDto, UpdateScreenDto } from './dto/screen.dto.js';

type ScreenWithPlaylist = Screen & { playlist: Pick<Playlist, 'id' | 'name'> | null };

const includePlaylist = { playlist: { select: { id: true, name: true } } } as const;

export function isOnline(lastSeenAt: Date | null, now = Date.now()): boolean {
  return lastSeenAt !== null && now - lastSeenAt.getTime() < ONLINE_THRESHOLD_MS;
}

@Injectable()
export class ScreensService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
  ) {}

  async list(): Promise<ScreenDto[]> {
    const screens = await this.prisma.screen.findMany({
      where: { pairedAt: { not: null } },
      orderBy: { pairedAt: 'asc' },
      include: includePlaylist,
    });
    return screens.map(toScreenDto);
  }

  /** Pareia a tela que está exibindo o código. */
  async pair(dto: PairScreenDto): Promise<ScreenDto> {
    const screen = await this.prisma.screen.findUnique({ where: { pairingCode: dto.code } });
    const valid =
      screen &&
      !screen.pairedAt &&
      screen.pairingExpiresAt &&
      screen.pairingExpiresAt.getTime() > Date.now();
    if (!valid)
      throw new NotFoundException('Código inválido ou expirado. Confira o número na tela.');

    if (dto.playlistId) await this.assertPlaylist(dto.playlistId);

    // updateMany com pairedAt: null evita que dois pareamentos simultâneos usem o mesmo código.
    const { count } = await this.prisma.screen.updateMany({
      where: { id: screen.id, pairedAt: null },
      data: {
        name: dto.name,
        location: dto.location ?? null,
        playlistId: dto.playlistId ?? null,
        pairedAt: new Date(),
        pairingCode: null,
        pairingExpiresAt: null,
      },
    });
    if (count === 0)
      throw new NotFoundException('Código inválido ou expirado. Confira o número na tela.');

    this.realtime.screenPaired(screen.id);
    return this.get(screen.id);
  }

  async get(id: string): Promise<ScreenDto> {
    const screen = await this.prisma.screen.findFirst({
      where: { id, pairedAt: { not: null } },
      include: includePlaylist,
    });
    if (!screen) throw new NotFoundException('Tela não encontrada');
    return toScreenDto(screen);
  }

  async update(id: string, dto: UpdateScreenDto): Promise<ScreenDto> {
    const current = await this.get(id);
    if (dto.playlistId) await this.assertPlaylist(dto.playlistId);

    const screen = await this.prisma.screen.update({
      where: { id },
      data: { name: dto.name, location: dto.location, playlistId: dto.playlistId },
      include: includePlaylist,
    });

    if (dto.playlistId !== undefined && dto.playlistId !== (current.playlist?.id ?? null)) {
      this.realtime.screenPlaylistChanged(id);
    }
    return toScreenDto(screen);
  }

  /** Desparear: apaga o registro. O player perde o acesso e volta a exibir um código. */
  async remove(id: string): Promise<void> {
    await this.get(id);
    await this.prisma.screen.delete({ where: { id } });
    this.realtime.screenUnpaired(id);
  }

  private async assertPlaylist(id: string): Promise<void> {
    const exists = await this.prisma.playlist.count({ where: { id } });
    if (!exists) throw new BadRequestException('Playlist não encontrada');
  }
}

export function toScreenDto(screen: ScreenWithPlaylist): ScreenDto {
  return {
    id: screen.id,
    name: screen.name ?? 'Tela sem nome',
    location: screen.location,
    playlist: screen.playlist,
    online: isOnline(screen.lastSeenAt),
    lastSeenAt: screen.lastSeenAt,
    pairedAt: screen.pairedAt ?? screen.createdAt,
  };
}

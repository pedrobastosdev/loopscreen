import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Media, Playlist, PlaylistItem } from '../generated/prisma/client.js';
import { toMediaDto } from '../media/media.service.js';
import { buildManifest, type Manifest } from '../player/manifest.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';
import type { PlaylistDetailDto, PlaylistSummaryDto, SavePlaylistDto } from './dto/playlist.dto.js';

const DEFAULT_IMAGE_DURATION = 10;

const withItems = {
  items: {
    orderBy: { order: 'asc' },
    include: { media: { include: { _count: { select: { items: true } } } } },
  },
  _count: { select: { screens: true } },
} as const;

type MediaWithCount = Media & { _count: { items: number } };
type PlaylistWithItems = Playlist & {
  items: (PlaylistItem & { media: MediaWithCount })[];
  _count: { screens: number };
};

/** Avisado sempre que o conteúdo de uma playlist muda (as telas recarregam o manifest). */
export type PlaylistChangeListener = (playlistId: string) => void;

@Injectable()
export class PlaylistsService {
  private readonly listeners = new Set<PlaylistChangeListener>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  onChange(listener: PlaylistChangeListener): void {
    this.listeners.add(listener);
  }

  async list(): Promise<PlaylistSummaryDto[]> {
    const playlists = await this.prisma.playlist.findMany({
      orderBy: { updatedAt: 'desc' },
      include: withItems,
    });

    return playlists.map((p) => {
      const images = p.items.filter((i) => i.media.type === 'IMAGE');
      const first = p.items[0];
      return {
        id: p.id,
        name: p.name,
        itemCount: p.items.length,
        imageDurationSec: images.reduce((sum, i) => sum + i.durationSec, 0),
        videoCount: p.items.length - images.length,
        screenCount: p._count.screens,
        cover: first ? this.media(first.media) : null,
        updatedAt: p.updatedAt,
      };
    });
  }

  async create(name: string): Promise<PlaylistDetailDto> {
    const playlist = await this.prisma.playlist.create({ data: { name }, include: withItems });
    return this.toDetail(playlist);
  }

  async get(id: string): Promise<PlaylistDetailDto> {
    return this.toDetail(await this.find(id));
  }

  /** Substitui nome e itens numa transação e avisa as telas que usam a playlist. */
  async save(id: string, dto: SavePlaylistDto): Promise<PlaylistDetailDto> {
    const mediaIds = [...new Set(dto.items.map((i) => i.mediaId))];

    const playlist = await this.prisma.$transaction(async (tx) => {
      const exists = await tx.playlist.findUnique({ where: { id }, select: { id: true } });
      if (!exists) throw new NotFoundException('Playlist não encontrada');

      const found = await tx.media.count({ where: { id: { in: mediaIds } } });
      if (found !== mediaIds.length) {
        throw new BadRequestException('Uma ou mais mídias não existem mais. Recarregue a página.');
      }

      await tx.playlistItem.deleteMany({ where: { playlistId: id } });
      await tx.playlistItem.createMany({
        data: dto.items.map((item, order) => ({
          playlistId: id,
          mediaId: item.mediaId,
          order,
          durationSec: item.durationSec ?? DEFAULT_IMAGE_DURATION,
        })),
      });
      return tx.playlist.update({
        where: { id },
        data: { name: dto.name, updatedAt: new Date() },
        include: withItems,
      });
    });

    this.emitChange(id);
    return this.toDetail(playlist);
  }

  async remove(id: string): Promise<void> {
    await this.prisma.playlist.delete({ where: { id } });
    // As telas ficam sem playlist (onDelete: SetNull) e são avisadas.
    this.emitChange(id);
  }

  async manifest(id: string): Promise<Manifest> {
    const playlist = await this.find(id);
    return buildManifest(playlist, (key) => this.storage.publicUrl(key));
  }

  private async find(id: string): Promise<PlaylistWithItems> {
    const playlist = await this.prisma.playlist.findUnique({ where: { id }, include: withItems });
    if (!playlist) throw new NotFoundException('Playlist não encontrada');
    return playlist;
  }

  private emitChange(id: string): void {
    for (const listener of this.listeners) listener(id);
  }

  private media(media: MediaWithCount) {
    return toMediaDto(media, media._count.items, (key) => this.storage.publicUrl(key));
  }

  private toDetail(playlist: PlaylistWithItems): PlaylistDetailDto {
    return {
      id: playlist.id,
      name: playlist.name,
      screenCount: playlist._count.screens,
      updatedAt: playlist.updatedAt,
      items: playlist.items.map((item) => ({
        id: item.id,
        order: item.order,
        durationSec: item.durationSec,
        media: this.media(item.media),
      })),
    };
  }
}

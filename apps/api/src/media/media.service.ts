import { randomUUID } from 'node:crypto';
import { rm } from 'node:fs/promises';
import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { fileTypeFromFile } from 'file-type';
import type { Media } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';
import type { MediaDto } from './dto/media.dto.js';
import { ALLOWED_MEDIA } from './media-types.js';

/** Arquivo recebido pelo multer, já gravado no diretório de entrada. */
export interface IncomingFile {
  path: string;
  originalname: string;
  size: number;
}

type MediaWithCount = Media & { _count: { items: number } };

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async list(): Promise<MediaDto[]> {
    const media = await this.prisma.media.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { items: true } } },
    });
    return media.map((m) => this.toDto(m));
  }

  /**
   * Valida todos os arquivos pelos magic bytes antes de gravar qualquer um.
   * Se um for inválido, nenhum é salvo e os temporários são apagados.
   */
  async upload(files: IncomingFile[]): Promise<MediaDto[]> {
    try {
      const detected = await Promise.all(
        files.map(async (file) => {
          const result = await fileTypeFromFile(file.path);
          const allowed = result ? ALLOWED_MEDIA[result.mime] : undefined;
          if (!result || !allowed) {
            throw new UnsupportedMediaTypeException(
              `"${file.originalname}" não é um formato aceito. Use JPG, PNG, WEBP, MP4 ou WEBM.`,
            );
          }
          return { file, mime: result.mime, ...allowed };
        }),
      );

      const created: MediaDto[] = [];
      for (const { file, mime, type, ext } of detected) {
        const filename = `${randomUUID()}.${ext}`;
        await this.storage.save(filename, file.path, mime);
        try {
          const media = await this.prisma.media.create({
            data: {
              name: displayName(file.originalname),
              type,
              filename,
              mimeType: mime,
              size: file.size,
            },
          });
          created.push(this.toDto({ ...media, _count: { items: 0 } }));
        } catch (error) {
          await this.storage.delete(filename);
          throw error;
        }
      }
      return created;
    } finally {
      // Remove o que sobrou no diretório de entrada (no sucesso, já foi movido).
      await Promise.all(files.map((f) => rm(f.path, { force: true })));
    }
  }

  async rename(id: string, name: string): Promise<MediaDto> {
    const media = await this.prisma.media.update({
      where: { id },
      data: { name },
      include: { _count: { select: { items: true } } },
    });
    return this.toDto(media);
  }

  /** Exclui a mídia, exceto se ela estiver em alguma playlist. */
  async remove(id: string): Promise<void> {
    const media = await this.prisma.media.findUnique({
      where: { id },
      include: {
        items: { select: { playlist: { select: { id: true, name: true } } } },
      },
    });
    if (!media) throw new NotFoundException('Mídia não encontrada');

    if (media.items.length > 0) {
      const playlists = [...new Map(media.items.map((i) => [i.playlist.id, i.playlist])).values()];
      const names = playlists.map((p) => `"${p.name}"`).join(', ');
      throw new ConflictException({
        statusCode: 409,
        error: 'Conflict',
        message: `Esta mídia está em uso na(s) playlist(s) ${names}. Remova-a das playlists antes de excluir.`,
        playlists,
      });
    }

    // Se alguém adicionar a mídia a uma playlist nesse meio-tempo, a FK (Restrict)
    // impede a exclusão e o filtro do Prisma responde 409.
    await this.prisma.media.delete({ where: { id } });
    await this.storage.delete(media.filename).catch((error: unknown) => {
      this.logger.warn(`Falha ao remover arquivo ${media.filename}: ${String(error)}`);
    });
  }

  private toDto(media: MediaWithCount): MediaDto {
    return {
      id: media.id,
      name: media.name,
      type: media.type,
      mimeType: media.mimeType,
      size: media.size,
      url: this.storage.publicUrl(media.filename),
      usageCount: media._count.items,
      createdAt: media.createdAt,
    };
  }
}

/** Nome amigável a partir do nome original do arquivo. */
export function displayName(originalName: string): string {
  const base = originalName.replace(/\.[^.]*$/, '');
  const cleaned = base
    .replace(/\p{Cc}/gu, '')
    .replace(/[_]+/g, ' ')
    .trim();
  return (cleaned || 'Sem nome').slice(0, 120);
}

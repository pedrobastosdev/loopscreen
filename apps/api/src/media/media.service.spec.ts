import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ConflictException, UnsupportedMediaTypeException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service.js';
import { displayName, MediaService } from './media.service.js';

// PNG 1x1 válido (os magic bytes é que importam)
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

function setup() {
  const prisma = {
    media: {
      findUnique: vi.fn(),
      delete: vi.fn(),
      create: vi.fn((args: { data: Record<string, unknown> }) => ({
        id: 'm1',
        createdAt: new Date(),
        ...args.data,
      })),
    },
  };
  const storage = {
    incomingDir: '/tmp',
    save: vi.fn(),
    delete: vi.fn(() => Promise.resolve()),
    publicUrl: (key: string) => `/uploads/${key}`,
  };
  const service = new MediaService(prisma as unknown as PrismaService, storage);
  return { prisma, storage, service };
}

async function tempFile(name: string, content: Buffer | string) {
  const dir = await mkdtemp(join(tmpdir(), 'loopscreen-test-'));
  const path = join(dir, 'upload');
  await writeFile(path, content);
  return { path, originalname: name, size: Buffer.byteLength(content) };
}

describe('MediaService.remove', () => {
  it('bloqueia a exclusão de mídia em uso e lista as playlists (sem duplicar)', async () => {
    const { prisma, storage, service } = setup();
    const vitrine = { id: 'p1', name: 'Loja – Vitrine' };
    prisma.media.findUnique.mockResolvedValue({
      id: 'm1',
      filename: 'a.jpg',
      items: [
        { playlist: vitrine },
        { playlist: vitrine },
        { playlist: { id: 'p2', name: 'Recepção' } },
      ],
    });

    const error = await service.remove('m1').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ConflictException);
    expect((error as ConflictException).getResponse()).toMatchObject({
      playlists: [vitrine, { id: 'p2', name: 'Recepção' }],
    });
    expect(prisma.media.delete).not.toHaveBeenCalled();
    expect(storage.delete).not.toHaveBeenCalled();
  });

  it('exclui o registro e o arquivo quando a mídia não está em uso', async () => {
    const { prisma, storage, service } = setup();
    prisma.media.findUnique.mockResolvedValue({ id: 'm1', filename: 'a.jpg', items: [] });

    await service.remove('m1');

    expect(prisma.media.delete).toHaveBeenCalledWith({ where: { id: 'm1' } });
    expect(storage.delete).toHaveBeenCalledWith('a.jpg');
  });
});

describe('MediaService.upload', () => {
  it('aceita PNG identificado pelos magic bytes e gera nome de arquivo próprio', async () => {
    const { storage, service } = setup();
    const file = await tempFile('promo_verao.png', PNG);

    const [media] = await service.upload([file]);

    expect(media).toMatchObject({ name: 'promo verao', type: 'IMAGE', mimeType: 'image/png' });
    expect(media?.url).toMatch(/^\/uploads\/[0-9a-f-]{36}\.png$/);
    expect(storage.save).toHaveBeenCalledOnce();
  });

  it('recusa SVG mesmo com extensão de imagem e não salva nenhum arquivo do lote', async () => {
    const { storage, service } = setup();
    const ok = await tempFile('ok.png', PNG);
    const svg = await tempFile('falso.png', '<svg xmlns="http://www.w3.org/2000/svg"></svg>');

    await expect(service.upload([ok, svg])).rejects.toBeInstanceOf(UnsupportedMediaTypeException);
    expect(storage.save).not.toHaveBeenCalled();
  });
});

describe('displayName', () => {
  it('remove a extensão e caracteres de controle', () => {
    expect(displayName('Cardápio\u0007 do dia.webp')).toBe('Cardápio do dia');
    expect(displayName('.mp4')).toBe('Sem nome');
  });
});

import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import { validateEnv } from '../config/env.js';
import { hashDeviceToken } from '../devices/device-token.js';
import { MediaType, type PrismaClient } from '../generated/prisma/client.js';
import { createPrismaClient } from '../prisma/create-prisma-client.js';
import { LocalStorageService } from '../storage/local-storage.service.js';
import { DEMO_BANNERS } from './demo/banners.js';
import { ensureAdmin } from './ensure-admin.js';

/**
 * Dados de demonstração (idempotente): admin, banners, 2 playlists e 2 telas.
 * Rodar de novo atualiza os banners e restaura o conteúdo das playlists demo.
 * Com --if-empty (usado no entrypoint quando SEED_DEMO=true), só cria a demo se
 * ainda não existir nenhuma playlist — assim um restart não desfaz edições.
 */
const PLAYLISTS = [
  {
    name: 'Loja – Vitrine',
    durationSec: 8,
    banners: ['promocao-de-verao', 'novidades-da-semana', 'siga-nos-no-instagram'],
  },
  {
    name: 'Recepção',
    durationSec: 10,
    banners: ['bem-vindo', 'cardapio-do-dia', 'siga-nos-no-instagram'],
  },
];

const SCREENS = [
  { name: 'Vitrine', location: 'Loja Centro', playlist: 'Loja – Vitrine' },
  { name: 'TV da Recepção', location: 'Térreo', playlist: 'Recepção' },
];

const env = validateEnv(process.env);
const prisma = createPrismaClient(env.DATABASE_URL);
const storage = new LocalStorageService(new ConfigService(env));

async function seedMedia(db: PrismaClient): Promise<Map<string, string>> {
  await storage.onModuleInit();
  const ids = new Map<string, string>();

  for (const banner of DEMO_BANNERS) {
    const filename = `demo-${banner.slug}.jpg`;
    const tmp = join(storage.incomingDir, `${filename}.tmp`);
    await writeFile(
      tmp,
      await sharp(Buffer.from(banner.svg)).jpeg({ quality: 86, mozjpeg: true }).toBuffer(),
    );
    const { size } = await stat(tmp);
    await storage.save(filename, tmp);

    const media = await db.media.upsert({
      where: { filename },
      update: { size },
      create: { name: banner.name, type: MediaType.IMAGE, filename, mimeType: 'image/jpeg', size },
    });
    ids.set(banner.slug, media.id);
    console.log(`  mídia: ${banner.name}`);
  }
  return ids;
}

async function seedPlaylists(
  db: PrismaClient,
  media: Map<string, string>,
): Promise<Map<string, string>> {
  const ids = new Map<string, string>();
  for (const spec of PLAYLISTS) {
    const playlist =
      (await db.playlist.findFirst({ where: { name: spec.name } })) ??
      (await db.playlist.create({ data: { name: spec.name } }));

    await db.$transaction([
      db.playlistItem.deleteMany({ where: { playlistId: playlist.id } }),
      db.playlistItem.createMany({
        data: spec.banners.map((slug, order) => ({
          playlistId: playlist.id,
          mediaId: media.get(slug) ?? '',
          order,
          durationSec: spec.durationSec,
        })),
      }),
      db.playlist.update({ where: { id: playlist.id }, data: { updatedAt: new Date() } }),
    ]);
    ids.set(spec.name, playlist.id);
    console.log(`  playlist: ${spec.name}`);
  }
  return ids;
}

async function seedScreens(db: PrismaClient, playlists: Map<string, string>): Promise<void> {
  for (const spec of SCREENS) {
    const playlistId = playlists.get(spec.playlist) ?? null;
    const existing = await db.screen.findFirst({
      where: { name: spec.name, pairedAt: { not: null } },
    });
    if (existing) {
      await db.screen.update({
        where: { id: existing.id },
        data: { location: spec.location, playlistId },
      });
    } else {
      // Token aleatório e descartado: as telas demo existem só para preencher o painel.
      await db.screen.create({
        data: {
          name: spec.name,
          location: spec.location,
          playlistId,
          pairedAt: new Date(),
          deviceTokenHash: hashDeviceToken(randomBytes(32).toString('base64url')),
        },
      });
    }
    console.log(`  tela: ${spec.name}`);
  }
}

try {
  console.log('Seed de demonstração');
  const admin = await ensureAdmin(prisma, env.ADMIN_EMAIL, env.ADMIN_PASSWORD);
  console.log(`  admin ${env.ADMIN_EMAIL}: ${admin}`);
  if (process.argv.includes('--if-empty') && (await prisma.playlist.count()) > 0) {
    console.log('  já existem playlists; demo ignorada (--if-empty).');
  } else {
    const media = await seedMedia(prisma);
    const playlists = await seedPlaylists(prisma, media);
    await seedScreens(prisma, playlists);
  }
  console.log('Pronto.');
} finally {
  await prisma.$disconnect();
}

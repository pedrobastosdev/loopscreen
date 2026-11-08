import { createHash } from 'node:crypto';
import type { MediaType } from '../generated/prisma/client.js';

export interface ManifestItem {
  /** id do PlaylistItem (estável entre salvamentos do mesmo item) */
  id: string;
  mediaId: string;
  type: MediaType;
  url: string;
  mimeType: string;
  /** Segundos na tela para imagens; null para vídeos (tocam até o fim). */
  durationSec: number | null;
}

export interface Manifest {
  playlistId: string | null;
  playlistName: string | null;
  /** Hash do conteúdo: muda só quando algo que afeta a exibição muda. */
  version: string;
  items: ManifestItem[];
}

export interface ManifestSourceItem {
  id: string;
  order: number;
  durationSec: number;
  media: { id: string; type: MediaType; filename: string; mimeType: string };
}

export interface ManifestSource {
  id: string;
  name: string;
  items: ManifestSourceItem[];
}

/**
 * Monta o manifest a partir da playlist. Função pura, usada pelo player e
 * pela pré-visualização do painel (mesma lógica nos dois lugares).
 */
export function buildManifest(
  playlist: ManifestSource | null,
  publicUrl: (filename: string) => string,
): Manifest {
  if (!playlist) {
    return { playlistId: null, playlistName: null, version: hashOf([]), items: [] };
  }

  const items = [...playlist.items]
    .sort((a, b) => a.order - b.order)
    .map<ManifestItem>((item) => ({
      id: item.id,
      mediaId: item.media.id,
      type: item.media.type,
      url: publicUrl(item.media.filename),
      mimeType: item.media.mimeType,
      durationSec: item.media.type === 'IMAGE' ? item.durationSec : null,
    }));

  return {
    playlistId: playlist.id,
    playlistName: playlist.name,
    version: hashOf(items.map((i) => [i.mediaId, i.url, i.type, i.durationSec])),
    items,
  };
}

function hashOf(value: unknown): string {
  return createHash('sha1').update(JSON.stringify(value)).digest('hex').slice(0, 16);
}

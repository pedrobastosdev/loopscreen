export interface ManifestItem {
  id: string;
  mediaId: string;
  type: 'IMAGE' | 'VIDEO';
  url: string;
  mimeType: string;
  /** Segundos na tela para imagens; null para vídeos (tocam até o fim). */
  durationSec: number | null;
}

export interface Manifest {
  playlistId: string | null;
  playlistName: string | null;
  version: string;
  items: ManifestItem[];
}

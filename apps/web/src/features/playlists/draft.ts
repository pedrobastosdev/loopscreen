import type { Media } from '@/features/media/types';

export interface DraftItem {
  /** Chave local (o mesmo arquivo pode aparecer mais de uma vez). */
  key: string;
  media: Media;
  durationSec: number;
}

export function clampDuration(value: number): number {
  if (!Number.isFinite(value)) return 10;
  return Math.min(3600, Math.max(1, Math.round(value)));
}

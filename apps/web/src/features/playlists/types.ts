import type { Media } from '@/features/media/types';

export interface PlaylistSummary {
  id: string;
  name: string;
  itemCount: number;
  imageDurationSec: number;
  videoCount: number;
  screenCount: number;
  cover: Media | null;
  updatedAt: string;
}

export interface PlaylistItem {
  id: string;
  order: number;
  durationSec: number;
  media: Media;
}

export interface PlaylistDetail {
  id: string;
  name: string;
  screenCount: number;
  items: PlaylistItem[];
  updatedAt: string;
}

export interface SavePlaylistInput {
  name: string;
  items: { mediaId: string; durationSec: number }[];
}

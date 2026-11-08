import { MediaType } from '../generated/prisma/client.js';

/** Formatos aceitos, identificados pelos magic bytes (nunca pela extensão ou pelo Content-Type). */
export const ALLOWED_MEDIA: Record<string, { type: MediaType; ext: string }> = {
  'image/jpeg': { type: MediaType.IMAGE, ext: 'jpg' },
  'image/png': { type: MediaType.IMAGE, ext: 'png' },
  'image/webp': { type: MediaType.IMAGE, ext: 'webp' },
  'video/mp4': { type: MediaType.VIDEO, ext: 'mp4' },
  'video/webm': { type: MediaType.VIDEO, ext: 'webm' },
};

export const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'webm'];
export const MAX_FILES_PER_REQUEST = 20;

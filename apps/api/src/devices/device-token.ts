import { createHash, randomBytes, randomInt } from 'node:crypto';

/** Token secreto do dispositivo (fica só no localStorage do player). */
export function generateDeviceToken(): string {
  return randomBytes(32).toString('base64url');
}

/** No banco guardamos apenas o hash: um vazamento do banco não expõe os tokens. */
export function hashDeviceToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Código de 6 dígitos exibido na tela para o pareamento. */
export function generatePairingCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

export const PAIRING_CODE_TTL_MS = 10 * 60 * 1000;
export const UNPAIRED_SCREEN_TTL_MS = 60 * 60 * 1000;
export const ONLINE_THRESHOLD_MS = 90 * 1000;

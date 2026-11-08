import type { Manifest } from './types';

export class PlayerApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'PlayerApiError';
  }
}

export interface PlayerManifest extends Manifest {
  screen: { id: string; name: string; location: string | null };
}

export type PlayerStatus =
  | { paired: false; pairingCode: string; expiresAt: string }
  | { paired: true; screen: { id: string; name: string } };

export const DEVICE_TOKEN_HEADER = 'x-device-token';

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (token) headers.set(DEVICE_TOKEN_HEADER, token);

  let res: Response;
  try {
    res = await fetch(`/api${path}`, { ...init, headers, cache: 'no-store' });
  } catch {
    throw new PlayerApiError(0, 'Sem conexão');
  }
  if (!res.ok) throw new PlayerApiError(res.status, res.statusText);
  return (await res.json()) as T;
}

export function registerDevice() {
  return request<{ deviceToken: string; pairingCode: string; expiresAt: string }>(
    '/devices/register',
    { method: 'POST' },
  );
}

export function fetchStatus(token: string) {
  return request<PlayerStatus>('/player/status', {}, token);
}

export function fetchManifest(token: string) {
  return request<PlayerManifest>('/player/manifest', {}, token);
}

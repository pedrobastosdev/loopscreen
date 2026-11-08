import type { PlayerManifest } from './player-api';

const MANIFEST_KEY = 'loopscreen.lastManifest';

/** Último manifest recebido, para o player continuar sem internet. */
export const manifestStorage = {
  load(): PlayerManifest | null {
    try {
      const raw = localStorage.getItem(MANIFEST_KEY);
      return raw ? (JSON.parse(raw) as PlayerManifest) : null;
    } catch {
      return null;
    }
  },
  save(manifest: PlayerManifest): void {
    try {
      localStorage.setItem(MANIFEST_KEY, JSON.stringify(manifest));
    } catch {
      /* ignora (storage cheio ou bloqueado) */
    }
  },
  clear(): void {
    try {
      localStorage.removeItem(MANIFEST_KEY);
    } catch {
      /* ignora */
    }
  },
};

/**
 * Registra o Service Worker. Só funciona em contexto seguro (HTTPS ou
 * localhost); em http://IP-da-rede o player funciona, mas sem cache offline.
 */
export async function registerServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
  try {
    await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  } catch {
    // Sem SW o player continua funcionando online.
  }
}

/** Pede ao Service Worker para baixar as mídias do manifest e descartar as antigas. */
export async function syncOfflineCache(manifest: PlayerManifest): Promise<void> {
  if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
  const registration = await navigator.serviceWorker.ready;
  const media = [
    ...new Set(manifest.items.map((item) => new URL(item.url, location.origin).pathname)),
  ];
  const assets = performance
    .getEntriesByType('resource')
    .map((entry) => new URL(entry.name).pathname)
    .filter((path) => path.startsWith('/assets/'));
  registration.active?.postMessage({ type: 'sync', media, assets });
}

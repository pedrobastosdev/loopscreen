import { useCallback, useEffect, useRef, useState } from 'react';
import { deviceStorage } from './device-storage';
import { manifestStorage, syncOfflineCache } from './offline';
import { useDeviceSocket } from './useDeviceSocket';
import {
  fetchManifest,
  fetchStatus,
  PlayerApiError,
  type PlayerManifest,
  registerDevice,
} from './player-api';

export type PlayerState =
  | { phase: 'starting' }
  | { phase: 'offline' }
  | { phase: 'pairing'; code: string; expiresAt: string }
  | { phase: 'playing'; manifest: PlayerManifest };

const PAIRING_POLL_MS = 5_000;
const MANIFEST_POLL_MS = 30_000;
const RETRY_MS = 10_000;

/** Evita registrar dois dispositivos se o efeito rodar duas vezes ao mesmo tempo. */
let registering: Promise<string> | null = null;

async function ensureToken(): Promise<string> {
  const existing = deviceStorage.get();
  if (existing) return existing;
  registering ??= registerDevice()
    .then(({ deviceToken }) => {
      deviceStorage.set(deviceToken);
      return deviceToken;
    })
    .finally(() => {
      registering = null;
    });
  return registering;
}

function sameManifest(a: PlayerManifest, b: PlayerManifest): boolean {
  return (
    a.version === b.version &&
    a.screen.name === b.screen.name &&
    a.screen.location === b.screen.location
  );
}

/**
 * Ciclo de vida do player: registra o dispositivo, mostra o código até ser
 * pareado e depois mantém o manifest atualizado. Sem conexão, continua
 * exibindo o que já tem.
 */
export function usePlayerSession() {
  const [state, setState] = useState<PlayerState>({ phase: 'starting' });
  const [token, setToken] = useState<string | null>(() => deviceStorage.get());
  const timer = useRef<number | undefined>(undefined);
  const tickRef = useRef<() => Promise<void>>(() => Promise.resolve());

  useEffect(() => {
    let cancelled = false;
    const schedule = (ms: number) => {
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => void tickRef.current(), ms);
    };

    async function showPairing(token: string) {
      const status = await fetchStatus(token);
      if (cancelled) return;
      if (status.paired) {
        // Pareou entre uma chamada e outra: busca o manifest já.
        schedule(0);
        return;
      }
      setState({ phase: 'pairing', code: status.pairingCode, expiresAt: status.expiresAt });
      schedule(PAIRING_POLL_MS);
    }

    async function tick() {
      try {
        const token = await ensureToken();
        if (!cancelled) setToken(token);
        try {
          const manifest = await fetchManifest(token);
          if (cancelled) return;
          manifestStorage.save(manifest);
          void syncOfflineCache(manifest).catch(() => undefined);
          setState((prev) =>
            prev.phase === 'playing' && sameManifest(prev.manifest, manifest)
              ? prev
              : { phase: 'playing', manifest },
          );
          schedule(MANIFEST_POLL_MS);
        } catch (error) {
          // 409: ainda não pareada
          if (error instanceof PlayerApiError && error.status === 409) {
            manifestStorage.clear();
            await showPairing(token);
          } else throw error;
        }
      } catch (error) {
        if (cancelled) return;
        if (error instanceof PlayerApiError && error.status === 401) {
          // Token desconhecido (tela removida no painel): registra de novo.
          deviceStorage.clear();
          manifestStorage.clear();
          setToken(null);
          setState({ phase: 'starting' });
          schedule(500);
          return;
        }
        // Sem conexão: mantém o que está na tela (ou o último manifest salvo) e tenta de novo.
        setState((prev) => {
          if (prev.phase !== 'starting' && prev.phase !== 'offline') return prev;
          const cached = manifestStorage.load();
          return cached ? { phase: 'playing', manifest: cached } : { phase: 'offline' };
        });
        schedule(RETRY_MS);
      }
    }

    tickRef.current = tick;
    void tick();
    return () => {
      cancelled = true;
      window.clearTimeout(timer.current);
    };
  }, []);

  /** Força uma sincronização imediata (usado pelos eventos em tempo real). */
  const refresh = useCallback(() => {
    window.clearTimeout(timer.current);
    void tickRef.current();
  }, []);

  const unpaired = useCallback(() => {
    deviceStorage.clear();
    manifestStorage.clear();
    setToken(null);
    refresh();
  }, [refresh]);

  useDeviceSocket(token, { onSync: refresh, onUnpaired: unpaired });

  return { state, refresh };
}

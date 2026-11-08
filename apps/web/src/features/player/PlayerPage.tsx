import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { IdleScreen } from './IdleScreen';
import { PairingScreen } from './PairingScreen';
import { PlayerEngine } from './PlayerEngine';
import { usePlayerSession } from './usePlayerSession';

/** Rota pública /player: tela cheia, fundo preto, sem cursor e sem UI do painel. */
export function PlayerPage() {
  const { state } = usePlayerSession();

  useKeepScreenAwake();
  useDoubleClickFullscreen();

  return (
    <div className="fixed inset-0 cursor-none select-none overflow-hidden bg-black">
      {state.phase === 'starting' && (
        <div className="flex size-full items-center justify-center">
          <Loader2 className="size-8 animate-spin text-zinc-700" />
        </div>
      )}
      {state.phase === 'offline' && (
        <IdleScreen title="Sem conexão" subtitle="Tentando reconectar ao servidor…" />
      )}
      {state.phase === 'pairing' && <PairingScreen code={state.code} />}
      {state.phase === 'playing' &&
        (state.manifest.items.length > 0 ? (
          <PlayerEngine items={state.manifest.items} version={state.manifest.version} />
        ) : (
          <IdleScreen
            title={state.manifest.screen.name}
            subtitle={
              state.manifest.playlistId
                ? 'A playlist desta tela está vazia.'
                : 'Nenhuma playlist atribuída a esta tela.'
            }
          />
        ))}
    </div>
  );
}

/** Pede ao navegador para não apagar a tela (quando suportado). */
function useKeepScreenAwake() {
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    const acquire = () => {
      if (document.visibilityState !== 'visible' || !('wakeLock' in navigator)) return;
      navigator.wakeLock
        .request('screen')
        .then((l) => (lock = l))
        .catch(() => undefined);
    };
    acquire();
    document.addEventListener('visibilitychange', acquire);
    return () => {
      document.removeEventListener('visibilitychange', acquire);
      void lock?.release().catch(() => undefined);
    };
  }, []);
}

/** Fora do modo kiosk, dois cliques alternam a tela cheia. */
function useDoubleClickFullscreen() {
  useEffect(() => {
    const toggle = () => {
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
      else void document.documentElement.requestFullscreen?.().catch(() => undefined);
    };
    window.addEventListener('dblclick', toggle);
    return () => window.removeEventListener('dblclick', toggle);
  }, []);
}

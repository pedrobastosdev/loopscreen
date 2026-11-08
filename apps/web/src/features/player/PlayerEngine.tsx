import { useCallback, useEffect, useReducer, useRef } from 'react';
import { cn } from '@/lib/utils';
import { engineReducer, initEngine, type Slot } from './engine-state';
import type { ManifestItem } from './types';

const FADE_MS = 700;
/** Se um vídeo ficar parado esse tempo, pula para o próximo. */
const STALL_TIMEOUT_MS = 15_000;
/** Se todos os itens falharem em sequência, espera antes de tentar de novo. */
const ALL_FAILED_BACKOFF_MS = 10_000;

/**
 * Loop de mídias em tela cheia. Usado pelo player das telas e pela
 * pré-visualização do painel.
 */
export function PlayerEngine({ items, version }: { items: ManifestItem[]; version: string }) {
  const [state, dispatch] = useReducer(engineReducer, items, initEngine);
  const itemsRef = useRef(items);
  const failures = useRef(0);

  // Nova versão da playlist: o item atual termina e a lista nova assume.
  useEffect(() => {
    itemsRef.current = items;
    dispatch({ type: 'sync', items });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- a versão identifica o conteúdo
  }, [version]);

  const advance = useCallback(
    (failed: boolean) => {
      failures.current = failed ? failures.current + 1 : 0;
      const delay =
        failed && failures.current >= Math.max(itemsRef.current.length, 1)
          ? ALL_FAILED_BACKOFF_MS
          : 0;
      if (delay) failures.current = 0;

      window.setTimeout(() => {
        const leaving = state.active;
        dispatch({ type: 'advance' });
        // Depois do fade, o slot que saiu carrega o item seguinte.
        window.setTimeout(
          () => dispatch({ type: 'refill', slot: leaving, items: itemsRef.current }),
          FADE_MS + 50,
        );
      }, delay);
    },
    [state.active],
  );

  return (
    <div className="relative size-full overflow-hidden bg-black">
      {state.slots.map((slot, i) =>
        slot ? (
          <MediaSlot
            key={slot.seq}
            slot={slot}
            active={state.active === i}
            loop={items.length === 1}
            onDone={advance}
          />
        ) : null,
      )}
    </div>
  );
}

function MediaSlot({
  slot,
  active,
  loop,
  onDone,
}: {
  slot: Slot;
  active: boolean;
  loop: boolean;
  onDone: (failed: boolean) => void;
}) {
  const { item } = slot;
  const videoRef = useRef<HTMLVideoElement>(null);
  const errored = useRef(false);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  // Ficou ativo com erro de carregamento: pula.
  useEffect(() => {
    if (active && errored.current) onDoneRef.current(true);
  }, [active]);

  // Imagem: fica durationSec na tela (com um item só, fica para sempre).
  useEffect(() => {
    if (!active || item.type !== 'IMAGE' || loop) return;
    const timer = window.setTimeout(
      () => onDoneRef.current(false),
      (item.durationSec ?? 10) * 1000,
    );
    return () => window.clearTimeout(timer);
  }, [active, item, loop]);

  // Vídeo: toca do início quando ativo, pausa quando inativo, com vigia de travamento.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || item.type !== 'VIDEO') return;
    if (!active) {
      video.pause();
      return;
    }
    video.currentTime = 0;
    video.play().catch(() => {
      // Autoplay bloqueado mesmo com muted: segue a playlist em vez de travar.
      if (!loop) onDoneRef.current(true);
    });

    let last = -1;
    let stalledFor = 0;
    const watchdog = window.setInterval(() => {
      if (video.paused && video.ended) return;
      if (video.currentTime === last) {
        stalledFor += 5000;
        if (stalledFor >= STALL_TIMEOUT_MS) onDoneRef.current(true);
      } else {
        stalledFor = 0;
        last = video.currentTime;
      }
    }, 5000);
    return () => window.clearInterval(watchdog);
  }, [active, item, loop]);

  const handleError = () => {
    errored.current = true;
    if (active) onDoneRef.current(true);
  };

  const className = cn(
    'absolute inset-0 size-full object-contain transition-opacity ease-in-out',
    active ? 'z-10 opacity-100' : 'z-0 opacity-0',
  );
  const style = { transitionDuration: `${FADE_MS}ms` };

  if (item.type === 'VIDEO') {
    return (
      <video
        ref={videoRef}
        src={item.url}
        className={className}
        style={style}
        muted
        playsInline
        autoPlay={active}
        loop={loop}
        preload="auto"
        disablePictureInPicture
        onEnded={() => active && onDoneRef.current(false)}
        onError={handleError}
      />
    );
  }

  return (
    <img
      src={item.url}
      alt=""
      className={className}
      style={style}
      decoding="async"
      draggable={false}
      onError={handleError}
    />
  );
}

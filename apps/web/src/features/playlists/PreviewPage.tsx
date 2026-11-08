import { useQuery } from '@tanstack/react-query';
import { Loader2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { IdleScreen } from '@/features/player/IdleScreen';
import { PlayerEngine } from '@/features/player/PlayerEngine';
import type { Manifest } from '@/features/player/types';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

/** Pré-visualização: a playlist rodando em tela cheia, com o mesmo motor do player. */
export function PreviewPage() {
  const { playlistId = '' } = useParams();
  const navigate = useNavigate();
  const [controlsVisible, setControlsVisible] = useState(true);

  const manifest = useQuery({
    queryKey: ['playlists', playlistId, 'manifest'],
    queryFn: () => api<Manifest>(`/playlists/${playlistId}/manifest`),
    refetchOnWindowFocus: true,
  });

  const close = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    void navigate(`/playlists/${playlistId}`);
  }, [navigate, playlistId]);

  // Controles aparecem ao mexer o mouse e somem sozinhos.
  useEffect(() => {
    let timer = window.setTimeout(() => setControlsVisible(false), 2500);
    const show = () => {
      setControlsVisible(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setControlsVisible(false), 2500);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.fullscreenElement) close();
    };
    window.addEventListener('mousemove', show);
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('mousemove', show);
      window.removeEventListener('keydown', onKey);
    };
  }, [close]);

  return (
    <div className={cn('fixed inset-0 bg-black', !controlsVisible && 'cursor-none')}>
      {manifest.isPending ? (
        <div className="flex size-full items-center justify-center">
          <Loader2 className="size-6 animate-spin text-zinc-500" />
        </div>
      ) : manifest.isError ? (
        <IdleScreen
          title="Não foi possível carregar a playlist"
          subtitle={manifest.error.message}
        />
      ) : manifest.data.items.length === 0 ? (
        <IdleScreen
          title={manifest.data.playlistName ?? 'Playlist'}
          subtitle="Esta playlist ainda não tem mídias."
        />
      ) : (
        <PlayerEngine items={manifest.data.items} version={manifest.data.version} />
      )}

      <div
        className={cn(
          'absolute inset-x-0 top-0 z-20 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent p-5 text-white transition-opacity duration-300',
          controlsVisible ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
        <div>
          <p className="text-xs uppercase tracking-wider text-white/60">Pré-visualização</p>
          <p className="font-medium">{manifest.data?.playlistName}</p>
        </div>
        <button
          type="button"
          onClick={close}
          className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm backdrop-blur transition-colors hover:bg-white/25"
        >
          <X className="size-4" /> Sair
        </button>
      </div>
    </div>
  );
}

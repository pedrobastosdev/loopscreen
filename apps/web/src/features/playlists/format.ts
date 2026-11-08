export function formatDuration(totalSec: number): string {
  if (totalSec < 60) return `${totalSec}s`;
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return sec ? `${min}min ${sec}s` : `${min}min`;
}

/** "4 itens · 40s + 2 vídeos" */
export function describePlaylist(p: {
  itemCount: number;
  imageDurationSec: number;
  videoCount: number;
}): string {
  if (p.itemCount === 0) return 'Vazia';
  const parts = [`${p.itemCount} ${p.itemCount === 1 ? 'item' : 'itens'}`];
  const images = p.itemCount - p.videoCount;
  if (images > 0) parts.push(formatDuration(p.imageDurationSec));
  if (p.videoCount > 0) parts.push(`${p.videoCount} ${p.videoCount === 1 ? 'vídeo' : 'vídeos'}`);
  return parts.join(' · ');
}

const UNITS = ['B', 'KB', 'MB', 'GB'];

export function formatBytes(bytes: number): string {
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit++;
  }
  const digits = unit === 0 || value >= 10 ? 0 : 1;
  return `${value.toLocaleString('pt-BR', { maximumFractionDigits: digits })} ${UNITS[unit]}`;
}

const relative = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });

/** "há 3 minutos", "ontem"… */
export function formatRelative(date: string | Date): string {
  const diffSec = (new Date(date).getTime() - Date.now()) / 1000;
  const abs = Math.abs(diffSec);
  if (abs < 45) return 'agora';
  if (abs < 3600) return relative.format(Math.round(diffSec / 60), 'minute');
  if (abs < 86_400) return relative.format(Math.round(diffSec / 3600), 'hour');
  return relative.format(Math.round(diffSec / 86_400), 'day');
}

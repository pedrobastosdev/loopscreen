import { Play } from 'lucide-react';

/** Tela neutra quando não há nada para exibir. */
export function IdleScreen({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-5 bg-zinc-950 text-center text-zinc-100">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-zinc-800/80">
        <Play className="size-6 fill-current text-zinc-400" />
      </div>
      <div className="space-y-2">
        <p className="text-[clamp(1.5rem,3vw,2.75rem)] font-semibold tracking-tight">{title}</p>
        {subtitle && <p className="text-[clamp(0.9rem,1.4vw,1.25rem)] text-zinc-400">{subtitle}</p>}
      </div>
    </div>
  );
}

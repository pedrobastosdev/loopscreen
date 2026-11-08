import { Logo } from '@/components/Logo';

/** Código grande no centro, legível de longe. */
export function PairingScreen({ code }: { code: string }) {
  const host = window.location.host;

  return (
    <div className="flex size-full flex-col bg-zinc-950 p-[4vmin] text-zinc-100">
      <Logo className="opacity-80" />
      <div className="flex flex-1 flex-col items-center justify-center gap-[4vmin] text-center">
        <p className="text-[clamp(1rem,2.2vmin,1.75rem)] font-medium uppercase tracking-[0.25em] text-zinc-400">
          Código de pareamento
        </p>
        <p
          className="text-[clamp(4rem,16vmin,14rem)] font-semibold leading-none tracking-[0.08em] tabular-nums"
          aria-label={code.split('').join(' ')}
        >
          {code.slice(0, 3)}
          <span className="text-zinc-600"> </span>
          {code.slice(3)}
        </p>
        <p className="max-w-[60ch] text-[clamp(1rem,2.4vmin,1.9rem)] leading-relaxed text-zinc-400">
          No painel <span className="text-zinc-200">{host}</span>, abra{' '}
          <span className="text-zinc-200">Telas → Adicionar tela</span> e digite este código.
        </p>
      </div>
      <p className="text-center text-[clamp(0.75rem,1.5vmin,1.1rem)] text-zinc-600">
        O código é renovado automaticamente.
      </p>
    </div>
  );
}

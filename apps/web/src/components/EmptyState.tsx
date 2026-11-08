import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

/** Estado vazio padrão: ícone + uma frase + um botão. */
export function EmptyState({
  icon: Icon,
  title,
  action,
}: {
  icon: LucideIcon;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-20 text-center">
      <div className="mb-4 flex size-11 items-center justify-center rounded-full bg-muted">
        <Icon className="size-5 text-muted-foreground" />
      </div>
      <p className="mb-5 max-w-xs text-sm text-muted-foreground">{title}</p>
      {action}
    </div>
  );
}

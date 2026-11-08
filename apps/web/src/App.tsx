import { MonitorPlay } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

type Health = 'checking' | 'ok' | 'down';

/** Tela provisória da etapa de setup: confirma que front e API conversam. */
export function App() {
  const [health, setHealth] = useState<Health>('checking');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => setHealth(res.ok ? 'ok' : 'down'))
      .catch(() => setHealth('down'));
  }, []);

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <MonitorPlay className="size-6" />
      </div>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">LoopScreen</h1>
        <p className="text-sm text-muted-foreground">
          API:{' '}
          {health === 'checking' ? 'verificando…' : health === 'ok' ? 'online' : 'indisponível'}
        </p>
      </div>
      <Button variant="outline" onClick={() => window.location.reload()}>
        Recarregar
      </Button>
    </main>
  );
}

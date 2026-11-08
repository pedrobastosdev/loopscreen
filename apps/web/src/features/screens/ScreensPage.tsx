import { Monitor, Plus } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';

export function ScreensPage() {
  return (
    <>
      <PageHeader title="Telas" description="Dispositivos que exibem suas playlists." />
      <EmptyState
        icon={Monitor}
        title="Nenhuma tela pareada ainda."
        action={
          <Button disabled>
            <Plus /> Adicionar tela
          </Button>
        }
      />
    </>
  );
}

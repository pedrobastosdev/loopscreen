import { Film, Upload } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';

export function MediaPage() {
  return (
    <>
      <PageHeader title="Mídias" description="Imagens e vídeos disponíveis para as playlists." />
      <EmptyState
        icon={Film}
        title="Sua biblioteca está vazia."
        action={
          <Button disabled>
            <Upload /> Enviar arquivos
          </Button>
        }
      />
    </>
  );
}

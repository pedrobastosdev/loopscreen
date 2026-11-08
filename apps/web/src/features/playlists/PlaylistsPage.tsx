import { ListVideo, Plus } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';

export function PlaylistsPage() {
  return (
    <>
      <PageHeader title="Playlists" description="Sequências de mídias exibidas em loop." />
      <EmptyState
        icon={ListVideo}
        title="Nenhuma playlist criada."
        action={
          <Button disabled>
            <Plus /> Nova playlist
          </Button>
        }
      />
    </>
  );
}

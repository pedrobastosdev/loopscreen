import { buildManifest, type ManifestSource } from './manifest.js';

const url = (filename: string) => `/uploads/${filename}`;

function playlist(overrides: Partial<ManifestSource> = {}): ManifestSource {
  return {
    id: 'p1',
    name: 'Vitrine',
    items: [
      {
        id: 'i2',
        order: 1,
        durationSec: 10,
        media: { id: 'm2', type: 'VIDEO', filename: 'b.mp4', mimeType: 'video/mp4' },
      },
      {
        id: 'i1',
        order: 0,
        durationSec: 8,
        media: { id: 'm1', type: 'IMAGE', filename: 'a.jpg', mimeType: 'image/jpeg' },
      },
    ],
    ...overrides,
  };
}

describe('buildManifest', () => {
  it('ordena pelos campos order e monta URLs públicas', () => {
    const manifest = buildManifest(playlist(), url);
    expect(manifest.items.map((i) => i.url)).toEqual(['/uploads/a.jpg', '/uploads/b.mp4']);
    expect(manifest.playlistName).toBe('Vitrine');
  });

  it('usa durationSec só para imagens (vídeos tocam até o fim)', () => {
    const [image, video] = buildManifest(playlist(), url).items;
    expect(image?.durationSec).toBe(8);
    expect(video?.durationSec).toBeNull();
  });

  it('mantém a mesma versão para o mesmo conteúdo', () => {
    expect(buildManifest(playlist(), url).version).toBe(buildManifest(playlist(), url).version);
  });

  it('muda a versão quando a ordem ou a duração muda', () => {
    const base = buildManifest(playlist(), url).version;
    const reordered = playlist();
    reordered.items[0]!.order = -1;
    const longer = playlist();
    longer.items[1]!.durationSec = 15;

    expect(buildManifest(reordered, url).version).not.toBe(base);
    expect(buildManifest(longer, url).version).not.toBe(base);
  });

  it('não muda a versão ao alterar a duração de um vídeo (ela é ignorada)', () => {
    const base = buildManifest(playlist(), url).version;
    const changed = playlist();
    changed.items[0]!.durationSec = 99;
    expect(buildManifest(changed, url).version).toBe(base);
  });

  it('retorna manifest vazio sem playlist', () => {
    expect(buildManifest(null, url)).toMatchObject({ playlistId: null, items: [] });
  });
});

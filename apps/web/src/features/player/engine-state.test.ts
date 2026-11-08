import { describe, expect, it } from 'vitest';
import { engineReducer, indexAfter, initEngine } from './engine-state';
import type { ManifestItem } from './types';

const item = (id: string, type: ManifestItem['type'] = 'IMAGE'): ManifestItem => ({
  id,
  mediaId: `m-${id}`,
  type,
  url: `/uploads/${id}`,
  mimeType: type === 'IMAGE' ? 'image/jpeg' : 'video/mp4',
  durationSec: type === 'IMAGE' ? 5 : null,
});

const abc = [item('a'), item('b'), item('c')];

describe('engine-state', () => {
  it('começa no primeiro item com o segundo pré-carregado', () => {
    const s = initEngine(abc);
    expect(s.slots[0]?.item.id).toBe('a');
    expect(s.slots[1]?.item.id).toBe('b');
    expect(s.active).toBe(0);
  });

  it('percorre a lista em loop: a → b → c → a', () => {
    let s = initEngine(abc);
    const seen = [s.slots[s.active]?.item.id];
    for (let i = 0; i < 3; i++) {
      const old = s.active;
      s = engineReducer(s, { type: 'advance' });
      s = engineReducer(s, { type: 'refill', slot: old, items: abc });
      seen.push(s.slots[s.active]?.item.id);
    }
    expect(seen).toEqual(['a', 'b', 'c', 'a']);
  });

  it('com um item só, não troca', () => {
    const s = initEngine([item('a')]);
    expect(engineReducer(s, { type: 'advance' })).toBe(s);
  });

  it('sync troca o próximo item sem interromper o atual', () => {
    const s = engineReducer(initEngine(abc), {
      type: 'sync',
      items: [item('a'), item('z'), item('b')],
    });
    expect(s.slots[0]?.item.id).toBe('a');
    expect(s.slots[1]?.item.id).toBe('z');
  });

  it('sync com lista vazia limpa os slots', () => {
    const s = engineReducer(initEngine(abc), { type: 'sync', items: [] });
    expect(s.slots).toEqual([null, null]);
  });

  it('indexAfter usa a posição antiga quando o id não existe mais', () => {
    expect(indexAfter(abc, { seq: 1, index: 1, item: item('sumiu') })).toBe(2);
  });
});

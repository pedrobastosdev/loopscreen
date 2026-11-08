import type { ManifestItem } from './types';

/**
 * Estado do player com duas "camadas" (slots): a ativa está na tela e a
 * inativa já carrega o próximo item, para não haver tela preta na troca.
 */
export interface Slot {
  /** Muda quando o conteúdo do slot muda (força recriar o <video>/<img>). */
  seq: number;
  index: number;
  item: ManifestItem;
}

export interface EngineState {
  slots: [Slot | null, Slot | null];
  active: 0 | 1;
  seq: number;
}

export type EngineAction =
  | { type: 'advance' }
  | { type: 'refill'; slot: 0 | 1; items: ManifestItem[] }
  | { type: 'sync'; items: ManifestItem[] };

/** Índice do item que vem depois do slot, tolerando mudanças na lista. */
export function indexAfter(items: ManifestItem[], slot: Slot | null): number {
  if (!slot || items.length === 0) return 0;
  const pos = items.findIndex((i) => i.id === slot.item.id);
  return ((pos === -1 ? slot.index : pos) + 1) % items.length;
}

function fill(
  state: EngineState,
  slotIdx: 0 | 1,
  items: ManifestItem[],
  index: number,
): EngineState {
  const item = items[index];
  const current = state.slots[slotIdx];
  if (!item) return state;
  // Mesmo item: reaproveita o elemento (sem recarregar o arquivo).
  if (current && current.item.id === item.id && current.item.url === item.url) {
    if (current.index === index) return state;
    const slots = [...state.slots] as EngineState['slots'];
    slots[slotIdx] = { ...current, index };
    return { ...state, slots };
  }
  const slots = [...state.slots] as EngineState['slots'];
  slots[slotIdx] = { seq: state.seq + 1, index, item };
  return { ...state, slots, seq: state.seq + 1 };
}

export function initEngine(items: ManifestItem[]): EngineState {
  let state: EngineState = { slots: [null, null], active: 0, seq: 0 };
  if (items.length === 0) return state;
  state = fill(state, 0, items, 0);
  if (items.length > 1) state = fill(state, 1, items, 1);
  return state;
}

export function engineReducer(state: EngineState, action: EngineAction): EngineState {
  switch (action.type) {
    case 'advance': {
      const next = state.active === 0 ? 1 : 0;
      if (!state.slots[next]) return state; // um item só: fica nele
      return { ...state, active: next };
    }
    case 'refill': {
      if (action.slot === state.active || action.items.length < 2) return state;
      return fill(
        state,
        action.slot,
        action.items,
        indexAfter(action.items, state.slots[state.active]),
      );
    }
    case 'sync': {
      const { items } = action;
      if (items.length === 0) return { slots: [null, null], active: 0, seq: state.seq };
      const current = state.slots[state.active];
      if (!current) return { ...initEngine(items), seq: state.seq + 2 };

      // O item atual continua até terminar; o próximo já vem da lista nova.
      const inactive = state.active === 0 ? 1 : 0;
      if (items.length === 1) {
        const slots = [...state.slots] as EngineState['slots'];
        slots[inactive] = null;
        const only = items[0];
        if (only && only.id !== current.item.id) {
          // O único item mudou: mostra o novo na próxima troca.
          slots[inactive] = { seq: state.seq + 1, index: 0, item: only };
          return { ...state, slots, seq: state.seq + 1 };
        }
        return { ...state, slots };
      }
      return fill(state, inactive, items, indexAfter(items, current));
    }
  }
}

import { useSyncExternalStore } from 'react';

import { STORIES } from '@stories/index';

import { GameStore, type GameSnapshot } from './GameStore';
import { storage } from './storage';

const stores = new Map<string, GameStore>();

/** Oynanabilir bir hikayenin deposu (ilk erişimde oluşturulur; oyun o an başlar) */
export function getGameStore(storyId: string): GameStore | undefined {
  const existing = stores.get(storyId);
  if (existing) return existing;
  const entry = STORIES.find((s) => s.id === storyId);
  if (!entry || entry.locked || !entry.story) return undefined;
  const store = new GameStore(entry.story, storage);
  stores.set(storyId, store);
  return store;
}

const noopSubscribe = () => () => {};
const nullSnapshot = () => null;

export function useGame(storyId: string): { store: GameStore | undefined; snap: GameSnapshot | null } {
  const store = getGameStore(storyId);
  const snap = useSyncExternalStore(
    store ? store.subscribe : noopSubscribe,
    store ? store.getSnapshot : nullSnapshot,
    store ? store.getSnapshot : nullSnapshot,
  );
  return { store, snap };
}

/** Cihaza özgü anonim oyuncu kimliği (Faz 5'te sunucu senkronu ve push için) */
export function getPlayerId(): string {
  const key = 'frekans:player';
  let id = storage.get(key);
  if (!id) {
    const c = (globalThis as { crypto?: Crypto }).crypto;
    id = c?.randomUUID ? c.randomUUID() : `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    storage.set(key, id);
  }
  return id;
}

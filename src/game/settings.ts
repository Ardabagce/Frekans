/**
 * Kullanıcı ayarları (cihazda saklanır): tema, uygulama içi ses ve titreşim.
 */
import { useSyncExternalStore } from 'react';

import { storage } from './storage';

export type ThemePreference = 'system' | 'light' | 'dark';

export type Settings = {
  theme: ThemePreference;
  /** Uygulama açıkken yeni mesajda kısa bir ses */
  sound: boolean;
  /** Uygulama açıkken yeni mesajda titreşim (destekleyen cihazlarda) */
  vibration: boolean;
};

const KEY = 'frekans:settings';
const DEFAULTS: Settings = { theme: 'system', sound: true, vibration: true };

function load(): Settings {
  try {
    const raw = storage.get(KEY);
    if (!raw) return DEFAULTS;
    const x = JSON.parse(raw) as Partial<Settings>;
    return {
      theme: x.theme === 'light' || x.theme === 'dark' || x.theme === 'system' ? x.theme : DEFAULTS.theme,
      sound: typeof x.sound === 'boolean' ? x.sound : DEFAULTS.sound,
      vibration: typeof x.vibration === 'boolean' ? x.vibration : DEFAULTS.vibration,
    };
  } catch {
    return DEFAULTS;
  }
}

let current = load();
const listeners = new Set<() => void>();

export function getSettings(): Settings {
  return current;
}

export function updateSettings(patch: Partial<Settings>) {
  current = { ...current, ...patch };
  storage.set(KEY, JSON.stringify(current));
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, getSettings, getSettings);
}

/**
 * PWA yardımcıları: service worker kaydı, kurulum durumu ve Android'in yerel kurulum istemi.
 */
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const isWeb = Platform.OS === 'web' && typeof window !== 'undefined';

/** Ana ekrandan (uygulama olarak) mı açıldı? */
export function isStandalone(): boolean {
  if (!isWeb) return true;
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia?.('(display-mode: standalone)').matches || nav.standalone === true;
}

export function isIOS(): boolean {
  if (!isWeb) return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/** iOS'ta Safari dışındaki tarayıcılar (Chrome vb.) da ana ekrana ekleyebilir ama Safari en güvenilir yol */
export function isIOSSafari(): boolean {
  if (!isIOS()) return false;
  return !/CriOS|FxiOS|EdgiOS|OPiOS/.test(navigator.userAgent);
}

export function registerServiceWorker() {
  if (!isWeb || !('serviceWorker' in navigator)) return;
  // Geliştirme sunucusunda (expo start) önbellek kafa karıştırmasın; yalnızca derlenmiş sürümde
  if (process.env.NODE_ENV !== 'production') return;
  // updateViaCache: 'none' → tarayıcı sw.js'yi HTTP önbelleğinden değil her seferinde sunucudan denetler
  navigator.serviceWorker
    .register('/sw.js', { updateViaCache: 'none' })
    .then((reg) => {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') reg.update().catch(() => {});
      });
    })
    .catch((e) => console.warn('[Frekans] SW kaydı başarısız', e));
}

// ---- Android/Chrome kurulum istemi ----
let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
if (isWeb) {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    listeners.forEach((l) => l());
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    listeners.forEach((l) => l());
  });
}

export function useInstallPrompt(): { canPrompt: boolean; prompt: () => Promise<boolean> } {
  const canPrompt = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => deferred !== null,
    () => false,
  );
  return {
    canPrompt,
    prompt: async () => {
      if (!deferred) return false;
      await deferred.prompt();
      const choice = await deferred.userChoice;
      deferred = null;
      listeners.forEach((l) => l());
      return choice.outcome === 'accepted';
    },
  };
}

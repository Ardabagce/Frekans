/**
 * Cihazda kalıcı anahtar–değer deposu.
 * Web/PWA: localStorage (eşzamanlı; açılışta "boş ekran" titremesi olmaz).
 * localStorage yoksa (ör. bazı gizli sekmeler) bellek içi yedeğe düşer; oyun yine çalışır
 * ama kalıcı olmaz — bu durum `isPersistent` ile bildirilir.
 */
export interface KeyValueStorage {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
  readonly isPersistent: boolean;
}

class MemoryStorage implements KeyValueStorage {
  private map = new Map<string, string>();
  readonly isPersistent = false;
  get(key: string) {
    return this.map.get(key) ?? null;
  }
  set(key: string, value: string) {
    this.map.set(key, value);
  }
  remove(key: string) {
    this.map.delete(key);
  }
}

class WebStorage implements KeyValueStorage {
  readonly isPersistent = true;
  constructor(private ls: Storage) {}
  get(key: string) {
    try {
      return this.ls.getItem(key);
    } catch {
      return null;
    }
  }
  set(key: string, value: string) {
    try {
      this.ls.setItem(key, value);
    } catch (e) {
      // Kota dolu vb. — oyun akışını bozmayalım
      console.warn('[Frekans] Kayıt yazılamadı', e);
    }
  }
  remove(key: string) {
    try {
      this.ls.removeItem(key);
    } catch {
      /* yok say */
    }
  }
}

function detect(): KeyValueStorage {
  try {
    const ls = (globalThis as { localStorage?: Storage }).localStorage;
    if (ls) {
      const probe = '__frekans_probe__';
      ls.setItem(probe, '1');
      ls.removeItem(probe);
      return new WebStorage(ls);
    }
  } catch {
    /* erişim reddedildi */
  }
  return new MemoryStorage();
}

export const storage: KeyValueStorage = detect();

/**
 * Tarayıcıdan kalıcı depolama izni ister (Chrome/Edge çoğu durumda sessizce verir,
 * ana ekrana eklenmiş PWA'da neredeyse her zaman). İzin varsa tarayıcı, disk dolsa
 * bile bu sitenin verisini kendiliğinden silmez.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    const nav = (globalThis as { navigator?: Navigator }).navigator;
    if (!nav?.storage?.persist) return false;
    if (await nav.storage.persisted()) return true;
    return await nav.storage.persist();
  } catch {
    return false;
  }
}

/**
 * Uygulama öne geldiğinde (sekme görünür oldu, sayfa önbellekten döndü, pencere odaklandı).
 * Mobil tarayıcılar arka planda zamanlayıcıları dondurur; dönüşte durum hemen tazelenmeli.
 */
export function onResume(listener: () => void): () => void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return () => {};
  let last = 0;
  const fire = () => {
    if (document.visibilityState !== 'visible') return;
    const now = Date.now();
    if (now - last < 300) return; // aynı dönüşte birden çok olay
    last = now;
    listener();
  };
  document.addEventListener('visibilitychange', fire);
  window.addEventListener('pageshow', fire);
  window.addEventListener('focus', fire);
  return () => {
    document.removeEventListener('visibilitychange', fire);
    window.removeEventListener('pageshow', fire);
    window.removeEventListener('focus', fire);
  };
}

/** Başka bir sekme aynı anahtarı değiştirdiğinde haber verir (web) */
export function onExternalChange(listener: (key: string) => void): () => void {
  const w = globalThis as { addEventListener?: Window['addEventListener']; removeEventListener?: Window['removeEventListener'] };
  if (!w.addEventListener || !w.removeEventListener) return () => {};
  const handler = (e: StorageEvent) => {
    if (e.key) listener(e.key);
  };
  w.addEventListener('storage', handler);
  return () => w.removeEventListener?.('storage', handler);
}

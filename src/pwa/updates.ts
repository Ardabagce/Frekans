/**
 * Otomatik güncelleme. Ana ekran uygulamaları (özellikle iOS) arka planda bellekte kalır;
 * yeni bir sürüm yayınlansa bile eski sayfa açık kalabilir. Burada:
 *  - uygulama öne geldiğinde /version.json sorulur,
 *  - gömülü derleme kimliğinden farklıysa sayfa yenilenir.
 * Yenileme yalnızca uygulama yeni öne geldiğinde (ya da arka plandayken) yapılır;
 * oyuncu okurken ekran aniden yenilenmez. Oyun durumu kayıttan birebir geri gelir.
 */
import { useEffect } from 'react';
import { Platform } from 'react-native';

export const BUILD_ID = process.env.EXPO_PUBLIC_BUILD_ID ?? 'gelistirme';

/** Öne geldikten sonra bu süre içinde yenilemek kullanıcıyı rahatsız etmez */
const FRESH_RESUME_MS = 6000;
const PERIODIC_CHECK_MS = 20 * 60_000;
/** Aynı hedef sürüm için en fazla bu aralıkla bir kez yenile (yayın sırasında döngüye girmesin) */
const RETRY_SAME_TARGET_MS = 10 * 60_000;
const ATTEMPT_KEY = 'frekans:update-attempt';

/** Bu hedef sürüm için yakın zamanda yenileme denendiyse tekrar deneme */
function mayReloadFor(target: string): boolean {
  try {
    const raw = localStorage.getItem(ATTEMPT_KEY);
    const prev = raw ? (JSON.parse(raw) as { target?: string; at?: number }) : null;
    if (prev?.target === target && Date.now() - (prev.at ?? 0) < RETRY_SAME_TARGET_MS) return false;
    localStorage.setItem(ATTEMPT_KEY, JSON.stringify({ target, at: Date.now() }));
    return true;
  } catch {
    return false;
  }
}

async function latestBuild(): Promise<string | null> {
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = (await res.json()) as { build?: unknown };
    return typeof data.build === 'string' ? data.build : null;
  } catch {
    return null;
  }
}

export function useAutoUpdate() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    if (BUILD_ID === 'gelistirme') return; // expo start: güncelleme denetimi yok

    let resumedAt = Date.now();
    let pending = false;
    let checking = false;

    let target = '';
    const reload = () => {
      if (mayReloadFor(target)) location.reload();
    };
    const reloadIfFresh = () => {
      const fresh = document.visibilityState === 'hidden' || Date.now() - resumedAt < FRESH_RESUME_MS;
      if (fresh) reload();
      else pending = true;
    };

    const check = async () => {
      if (checking) return;
      checking = true;
      const latest = await latestBuild();
      checking = false;
      if (latest && latest !== BUILD_ID) {
        target = latest;
        reloadIfFresh();
      }
    };

    const onVisibility = () => {
      if (document.visibilityState !== 'visible') return;
      resumedAt = Date.now();
      if (pending) {
        pending = false;
        reload();
        return;
      }
      void check();
    };

    void check(); // soğuk açılış: bellekten eski sayfa geldiyse hemen yenile
    document.addEventListener('visibilitychange', onVisibility);
    const timer = setInterval(() => document.visibilityState === 'visible' && void check(), PERIODIC_CHECK_MS);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      clearInterval(timer);
    };
  }, []);
}

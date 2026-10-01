/**
 * Sohbet listesinin üstündeki küçük şerit:
 *  - Tarayıcıda açıldıysa: "Ana ekrana ekle" önerisi (rehberi açar)
 *  - Ana ekran uygulaması ilk kez ve boş kayıtla açıldıysa: "Tarayıcıda başladıysan kodla devam et"
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { getGameStore } from '@/game/registry';
import { storage } from '@/game/storage';
import { isStandalone } from '@/pwa/pwa';
import { useTheme } from '@/theme/ThemeProvider';

import { InstallGuide } from './InstallGuide';

const DISMISS_KEY = 'frekans:install-banner';
const RESHOW_AFTER_MS = 3 * 24 * 3600_000;

function dismissedRecently(kind: string): boolean {
  const raw = storage.get(`${DISMISS_KEY}:${kind}`);
  return raw !== null && Date.now() - Number(raw) < RESHOW_AFTER_MS;
}

export function InstallBanner() {
  const { palette: C } = useTheme();
  const router = useRouter();
  const [guide, setGuide] = useState(false);
  const standalone = isStandalone();
  const fresh = (getGameStore('dag-evi')?.getSnapshot().dev.eventCount ?? 1) === 0;
  const kind = standalone ? 'devam' : 'kur';
  const [hidden, setHidden] = useState(() => dismissedRecently(kind));

  if (Platform.OS !== 'web' || hidden) return guide ? <InstallGuide visible onClose={() => setGuide(false)} /> : null;
  if (standalone && !fresh) return null;

  const dismiss = () => {
    storage.set(`${DISMISS_KEY}:${kind}`, String(Date.now()));
    setHidden(true);
  };

  const text = standalone
    ? 'Tarayıcıda oynamaya başlamıştın mı? Kayıt kodunla kaldığın yerden devam et.'
    : 'Uygulama gibi oyna: ana ekrana ekle, tam ekran açılsın.';
  const action = standalone ? 'Kodla devam et' : 'Nasıl?';

  return (
    <>
      <View style={[styles.bar, { backgroundColor: C.systemChip }]}>
        <Text style={[styles.text, { color: C.text }]}>{text}</Text>
        <View style={styles.actions}>
          <Pressable
            onPress={() => (standalone ? router.push('/ayarlar') : setGuide(true))}
            accessibilityRole="button"
            style={({ pressed }) => [styles.btn, { backgroundColor: C.accent, opacity: pressed ? 0.85 : 1 }]}
          >
            <Text style={styles.btnText}>{action}</Text>
          </Pressable>
          <Pressable onPress={dismiss} accessibilityRole="button" accessibilityLabel="Kapat" hitSlop={10} style={styles.close}>
            <Text style={[styles.closeText, { color: C.textSecondary }]}>Şimdi değil</Text>
          </Pressable>
        </View>
      </View>
      {guide ? <InstallGuide visible onClose={() => setGuide(false)} /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  bar: { margin: 10, borderRadius: 12, padding: 12, gap: 10 },
  text: { fontSize: 14, lineHeight: 19 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  btn: { borderRadius: 16, paddingHorizontal: 14, height: 34, justifyContent: 'center' },
  btnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  close: { paddingVertical: 6 },
  closeText: { fontSize: 13.5, fontWeight: '500' },
});

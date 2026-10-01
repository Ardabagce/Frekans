import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getGameStore } from '@/game/registry';
import { updateSettings, useSettings, type ThemePreference } from '@/game/settings';
import { storage } from '@/game/storage';
import { useTheme } from '@/theme/ThemeProvider';
import { AppBar } from '@/ui/AppBar';
import { FormButton as Button, FormRow as Row, FormSection as Section } from '@/ui/form';
import { isStandalone } from '@/pwa/pwa';
import { BUILD_ID } from '@/pwa/updates';
import { InstallGuide } from '@/ui/install/InstallGuide';
import { playableStories } from '@stories/index';

const THEMES: { id: ThemePreference; label: string }[] = [
  { id: 'system', label: 'Sistem' },
  { id: 'light', label: 'Açık' },
  { id: 'dark', label: 'Koyu' },
];

async function copyText(text: string): Promise<boolean> {
  try {
    const nav = (globalThis as { navigator?: Navigator }).navigator;
    if (!nav?.clipboard?.writeText) return false;
    await nav.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { palette: C } = useTheme();
  const settings = useSettings();
  // Şimdilik tek oynanabilir hikaye var; kayıt işlemleri onun için
  const story = playableStories()[0];
  const store = story ? getGameStore(story.id) : undefined;

  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [guide, setGuide] = useState(false);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <View style={[styles.screen, { backgroundColor: C.composerBar }]}>
      <AppBar title="Ayarlar" onBack={goBack} />
      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: 24 + insets.bottom }]} keyboardShouldPersistTaps="handled">
        <Section title="GÖRÜNÜM">
          <View style={[styles.segment, { borderColor: C.choiceBorder }]}>
            {THEMES.map((t) => {
              const active = settings.theme === t.id;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => updateSettings({ theme: t.id })}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[styles.segItem, active && { backgroundColor: C.accent }]}
                >
                  <Text style={[styles.segText, { color: active ? '#FFFFFF' : C.choiceText }]}>{t.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        {Platform.OS === 'web' && !isStandalone() ? (
          <Section title="UYGULAMA" note="Ana ekrana eklenince tam ekran açılır; bildirimler de ancak böyle çalışır (özellikle iPhone'da).">
            <Row label="Ana ekrana ekle" sub="Adım adım rehber" right={<Button label="Göster" onPress={() => setGuide(true)} />} />
          </Section>
        ) : null}

        <Section title="UYGULAMA AÇIKKEN" note="Uygulama kapalıyken gelen mesajlar için bildirimler ayrıca ayarlanır.">
          <Row
            label="Mesaj sesi"
            sub="Yeni mesaj düştüğünde kısa bir ses"
            right={<Switch value={settings.sound} onValueChange={(sound) => updateSettings({ sound })} />}
          />
          <Row
            label="Titreşim"
            sub={Platform.OS === 'web' ? 'Destekleyen telefonlarda (çoğu Android)' : undefined}
            right={<Switch value={settings.vibration} onValueChange={(vibration) => updateSettings({ vibration })} />}
          />
        </Section>

        {store ? (
          <Section
            title="İLERLEME"
            note={
              storage.isPersistent
                ? 'İlerlemen bu cihazda otomatik kaydedilir; giriş yapman gerekmez. Tarayıcı verilerini silersen ya da başka bir cihaza geçersen kayıt kodunu kullan.'
                : 'Bu tarayıcı veri kaydetmeye izin vermiyor (gizli sekme olabilir). İlerlemeni korumak için kayıt kodunu sakla.'
            }
          >
            <View style={styles.pad}>
              <Text style={[styles.rowLabel, { color: C.text }]}>Kayıt kodu</Text>
              <Text style={[styles.rowSub, { color: C.textSecondary }]}>
                Kodu bir yere not et ya da kendine gönder. Başka bir cihazda “Kodla devam et” ile kaldığın yerden sürer.
              </Text>
              <View style={styles.btnRow}>
                <Button
                  label="Kodu kopyala"
                  primary
                  onPress={async () => {
                    const c = store.exportCode();
                    setCode(c);
                    setCopied(await copyText(c));
                  }}
                />
                <Button label="Kodla devam et" onPress={() => { setImportOpen((o) => !o); setImportMsg(null); }} />
              </View>
              {code ? (
                <View style={[styles.codeBox, { backgroundColor: C.composerField, borderColor: C.divider }]}>
                  <Text selectable style={[styles.code, { color: C.text }]}>{code}</Text>
                  <Text style={[styles.rowSub, { color: copied ? C.accent : C.textSecondary }]}>
                    {copied ? 'Kopyalandı.' : 'Otomatik kopyalanamadı; kodu seçip kopyala.'}
                  </Text>
                </View>
              ) : null}
              {importOpen ? (
                <View style={styles.importBox}>
                  <TextInput
                    value={importText}
                    onChangeText={setImportText}
                    placeholder="FRK1-…"
                    placeholderTextColor={C.composerPlaceholder}
                    multiline
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[styles.input, { color: C.text, borderColor: C.choiceBorder, backgroundColor: C.composerField }]}
                  />
                  <Text style={[styles.rowSub, { color: C.textSecondary }]}>
                    Dikkat: bu cihazdaki mevcut ilerlemenin yerini alır (eskisi yedekte tutulur).
                  </Text>
                  <View style={styles.btnRow}>
                    <Button
                      label="Yükle"
                      primary
                      onPress={() => {
                        const err = store.importCode(importText);
                        setImportMsg(err ? { ok: false, text: err } : { ok: true, text: 'Kayıt yüklendi. Kaldığın yerden devam edebilirsin.' });
                        if (!err) setImportText('');
                      }}
                    />
                  </View>
                </View>
              ) : null}
              {importMsg ? (
                <Text style={[styles.rowSub, { color: importMsg.ok ? C.accent : C.lockedReason }]}>{importMsg.text}</Text>
              ) : null}
            </View>
          </Section>
        ) : null}

        {store ? (
          <Section title="HİKAYE">
            <View style={styles.pad}>
              <Text style={[styles.rowLabel, { color: C.text }]}>{store.story.title}</Text>
              <Text style={[styles.rowSub, { color: C.textSecondary }]}>
                Baştan başlatınca sohbet silinir ve Deniz sana yeniden yazar. Bulduğun sonlar kayıtlı kalır.
              </Text>
              <View style={styles.btnRow}>
                {confirmRestart ? (
                  <>
                    <Button label="Vazgeç" onPress={() => setConfirmRestart(false)} />
                    <Button
                      label="Evet, baştan başlat"
                      danger
                      onPress={() => {
                        store.restart();
                        setConfirmRestart(false);
                        router.replace('/');
                      }}
                    />
                  </>
                ) : (
                  <Button label="Hikayeyi baştan başlat" danger onPress={() => setConfirmRestart(true)} />
                )}
              </View>
            </View>
          </Section>
        ) : null}

        <Text style={[styles.footer, { color: C.textSecondary }]}>Frekans · hikaye {story?.version ?? '—'} · derleme {BUILD_ID}</Text>
        {guide ? <InstallGuide visible onClose={() => setGuide(false)} /> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { padding: 12, gap: 18 },
  rowLabel: { fontSize: 15.5, fontWeight: '500' },
  rowSub: { fontSize: 12.5, lineHeight: 17, marginTop: 2 },
  segment: { flexDirection: 'row', margin: 10, borderWidth: 1, borderRadius: 18, overflow: 'hidden' },
  segItem: { flex: 1, height: 36, alignItems: 'center', justifyContent: 'center' },
  segText: { fontSize: 14, fontWeight: '600' },
  pad: { padding: 14, gap: 4 },
  btnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  codeBox: { marginTop: 10, borderWidth: 1, borderRadius: 10, padding: 10, gap: 6 },
  code: { fontSize: 12, fontFamily: Platform.select({ web: 'ui-monospace, monospace', default: undefined }) },
  importBox: { marginTop: 10, gap: 6 },
  input: { borderWidth: 1, borderRadius: 10, padding: 10, minHeight: 80, fontSize: 16, textAlignVertical: 'top' },
  footer: { textAlign: 'center', fontSize: 12 },
});

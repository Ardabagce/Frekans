/**
 * "Ana Ekrana Ekle" rehberi. iOS'ta tam ekran ve bildirimler yalnızca ana ekrana
 * eklenmiş uygulamada çalışır; ayrıca ana ekran uygulamasının deposu Safari'den
 * ayrıdır, bu yüzden ilerleme kayıt koduyla taşınır.
 */
import { useState, type ReactNode } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getGameStore } from '@/game/registry';
import { isIOS, useInstallPrompt } from '@/pwa/pwa';
import { useTheme } from '@/theme/ThemeProvider';
import { FormButton } from '@/ui/form';

function ShareGlyph({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path d="M12 3v12M8 7l4-4 4 4" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6 11v9h12v-9" stroke={color} strokeWidth={2} fill="none" strokeLinejoin="round" />
    </Svg>
  );
}

function PlusGlyph({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Rect x={3} y={3} width={18} height={18} rx={4} stroke={color} strokeWidth={2} fill="none" />
      <Path d="M12 8v8M8 12h8" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  const { palette: C } = useTheme();
  return (
    <View style={styles.step}>
      <View style={[styles.num, { backgroundColor: C.accent }]}>
        <Text style={styles.numText}>{n}</Text>
      </View>
      <View style={styles.stepBody}>{children}</View>
    </View>
  );
}

function T({ children, bold }: { children: ReactNode; bold?: boolean }) {
  const { palette: C } = useTheme();
  return <Text style={[styles.text, { color: C.text }, bold && styles.bold]}>{children}</Text>;
}

export function InstallGuide({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { palette: C } = useTheme();
  const insets = useSafeAreaInsets();
  const { canPrompt, prompt } = useInstallPrompt();
  const ios = isIOS();
  const store = getGameStore('dag-evi');
  const hasProgress = (store?.getSnapshot().dev.eventCount ?? 0) > 0;
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  let n = 0;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: C.background, paddingBottom: Math.max(16, insets.bottom + 8) }]}>
          <ScrollView contentContainerStyle={styles.body}>
            <Text style={[styles.title, { color: C.text }]}>Frekans’ı ana ekrana ekle</Text>
            <Text style={[styles.lead, { color: C.textSecondary }]}>
              Tam ekran açılır, adres çubuğu kaybolur ve Deniz döndüğünde bildirim alabilirsin.
            </Text>

            {canPrompt ? (
              <View style={styles.cta}>
                <FormButton label="Uygulamayı yükle" primary onPress={() => void prompt().then((ok) => ok && onClose())} />
              </View>
            ) : null}

            {hasProgress ? (
              <Step n={++n}>
                <T bold>Önce ilerlemeni kopyala</T>
                <Text style={[styles.sub, { color: C.textSecondary }]}>
                  Ana ekrandaki uygulama tarayıcıdan ayrı çalışır. Kodla orada kaldığın yerden devam edersin.
                </Text>
                <View style={styles.inline}>
                  <FormButton
                    small
                    label={copied ? 'Kopyalandı' : 'Kayıt kodunu kopyala'}
                    active={copied}
                    onPress={async () => {
                      const c = store!.exportCode();
                      setCode(c);
                      setCopied(await copy(c));
                    }}
                  />
                </View>
                {code && !copied ? (
                  <Text selectable style={[styles.code, { color: C.text, borderColor: C.divider }]}>{code}</Text>
                ) : null}
              </Step>
            ) : null}

            {ios ? (
              <>
                <Step n={++n}>
                  <View style={styles.inline}>
                    <T>Safari’de</T>
                    <ShareGlyph color={C.accent} />
                    <T bold>Paylaş</T>
                    <T>düğmesine dokun.</T>
                  </View>
                  <Text style={[styles.sub, { color: C.textSecondary }]}>
                    Alttaki çubukta; görünmüyorsa önce “•••” düğmesine dokun.
                  </Text>
                </Step>
                <Step n={++n}>
                  <View style={styles.inline}>
                    <PlusGlyph color={C.accent} />
                    <T>
                      <Text style={styles.bold}>Ana Ekrana Ekle</Text>’yi seç.
                    </T>
                  </View>
                  <Text style={[styles.sub, { color: C.textSecondary }]}>Listede biraz aşağıda olabilir.</Text>
                </Step>
                <Step n={++n}>
                  <T>
                    <Text style={styles.bold}>Web Uygulaması olarak aç</Text> açık kalsın, sağ üstten{' '}
                    <Text style={styles.bold}>Ekle</Text>’ye dokun.
                  </T>
                </Step>
              </>
            ) : (
              <Step n={++n}>
                <T>
                  Tarayıcı menüsünden (<Text style={styles.bold}>⋮</Text>) <Text style={styles.bold}>Uygulamayı yükle</Text> ya
                  da <Text style={styles.bold}>Ana ekrana ekle</Text>’yi seç.
                </T>
              </Step>
            )}
            <Step n={++n}>
              <T>
                Ana ekrandaki <Text style={styles.bold}>Frekans</Text> simgesinden aç.
                {hasProgress ? ' Ayarlar → Kodla devam et ile kodu yapıştır.' : ''}
              </T>
            </Step>

            <View style={styles.cta}>
              <FormButton label="Tamam" onPress={onClose} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end', alignItems: 'center' },
  sheet: { width: '100%', maxWidth: 560, maxHeight: '90%', borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  body: { padding: 20, gap: 14 },
  title: { fontSize: 20, fontWeight: '700' },
  lead: { fontSize: 14.5, lineHeight: 20 },
  cta: { alignItems: 'flex-start', marginTop: 4 },
  step: { flexDirection: 'row', gap: 12 },
  num: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  numText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  stepBody: { flex: 1, gap: 4 },
  inline: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5 },
  text: { fontSize: 15.5, lineHeight: 22 },
  bold: { fontWeight: '700' },
  sub: { fontSize: 13, lineHeight: 18 },
  code: { fontSize: 11.5, borderWidth: 1, borderRadius: 8, padding: 8, marginTop: 6 },
});

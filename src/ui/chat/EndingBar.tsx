import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { EndingKind } from '@/engine/types';
import { useTheme } from '@/theme/ThemeProvider';
import { RestartIcon } from '@/ui/icons';

const KIND_LABEL: Record<EndingKind, string> = {
  iyi: 'İyi son',
  kismi: 'Kısmi kurtuluş',
  kotu: 'Kötü son',
  olum: 'Son',
};

type Props = {
  ending: { kind: EndingKind; title: string; summary: string };
  endingsSeen: number;
  endingsTotal: number;
  onRestart: () => void;
};

/** Hikaye bittiğinde seçim çubuğunun yerine geçer: sonun adı ve "Yeniden oyna" */
export function EndingBar({ ending, endingsSeen, endingsTotal, onRestart }: Props) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const [confirm, setConfirm] = useState(false);

  return (
    <View style={[styles.bar, { backgroundColor: palette.composerBar, paddingBottom: 12 + insets.bottom }]}>
      <Text style={[styles.kind, { color: palette.accent }]}>{KIND_LABEL[ending.kind].toLocaleUpperCase('tr')}</Text>
      <Text style={[styles.title, { color: palette.text }]}>{ending.title}</Text>
      <Text style={[styles.summary, { color: palette.textSecondary }]}>{ending.summary}</Text>
      <Text style={[styles.count, { color: palette.textSecondary }]}>
        Bulunan sonlar: {endingsSeen}/{endingsTotal}
      </Text>
      {confirm ? (
        <View style={styles.row}>
          <Pressable
            onPress={() => setConfirm(false)}
            style={[styles.btn, { borderColor: palette.choiceBorder, backgroundColor: palette.choiceBackground }]}
            accessibilityRole="button"
          >
            <Text style={[styles.btnText, { color: palette.textSecondary }]}>Vazgeç</Text>
          </Pressable>
          <Pressable
            onPress={onRestart}
            style={[styles.btn, { borderColor: palette.accent, backgroundColor: palette.accent }]}
            accessibilityRole="button"
          >
            <Text style={[styles.btnText, { color: '#FFFFFF' }]}>Evet, baştan başla</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={() => setConfirm(true)}
          style={({ pressed }) => [
            styles.btn,
            styles.single,
            { borderColor: palette.choiceBorder, backgroundColor: pressed ? palette.choicePressed : palette.choiceBackground },
          ]}
          accessibilityRole="button"
        >
          <RestartIcon color={palette.choiceText} />
          <Text style={[styles.btnText, { color: palette.choiceText }]}>Yeniden oyna</Text>
        </Pressable>
      )}
      {confirm ? (
        <Text style={[styles.note, { color: palette.textSecondary }]}>
          Bu sohbet silinir ve Deniz sana yeniden yazar. Bulduğun sonlar kayıtlı kalır.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { paddingHorizontal: 16, paddingTop: 14, alignItems: 'center' },
  kind: { fontSize: 11.5, fontWeight: '700', letterSpacing: 1.2 },
  title: { fontSize: 18, fontWeight: '700', marginTop: 4, textAlign: 'center' },
  summary: { fontSize: 14, lineHeight: 19, textAlign: 'center', marginTop: 4, maxWidth: 420 },
  count: { fontSize: 12, marginTop: 8 },
  row: { flexDirection: 'row', gap: 8, marginTop: 12 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 18,
    height: 42,
  },
  single: { marginTop: 12, minWidth: 200 },
  btnText: { fontSize: 15, fontWeight: '600' },
  note: { fontSize: 12, marginTop: 8, textAlign: 'center' },
});

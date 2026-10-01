/** Ayarlar ve geliştirici paneli için küçük form parçaları */
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

export function FormSection({ title, children, note, bordered = false }: { title: string; children: ReactNode; note?: string; bordered?: boolean }) {
  const { palette: C } = useTheme();
  return (
    <View style={[styles.section, bordered && [styles.bordered, { borderColor: C.divider }]]}>
      <Text style={[styles.sectionTitle, { color: C.accent }]}>{title}</Text>
      {bordered ? children : <View style={[styles.card, { backgroundColor: C.background, borderColor: C.divider }]}>{children}</View>}
      {note ? <Text style={[styles.note, { color: C.textSecondary }]}>{note}</Text> : null}
    </View>
  );
}

export function FormRow({ label, sub, right }: { label: string; sub?: string; right: ReactNode }) {
  const { palette: C } = useTheme();
  return (
    <View style={[styles.row, { borderColor: C.divider }]}>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color: C.text }]}>{label}</Text>
        {sub ? <Text style={[styles.rowSub, { color: C.textSecondary }]}>{sub}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function FormButton({
  label,
  onPress,
  primary,
  danger,
  active,
  small,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
  danger?: boolean;
  active?: boolean;
  small?: boolean;
}) {
  const { palette: C } = useTheme();
  const filled = primary || active;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.btn,
        small && styles.small,
        {
          backgroundColor: filled ? C.accent : pressed ? C.choicePressed : C.choiceBackground,
          borderColor: danger ? C.lockedReason : filled ? C.accent : C.choiceBorder,
        },
      ]}
    >
      <Text style={[styles.btnText, small && styles.smallText, { color: filled ? '#FFFFFF' : danger ? C.lockedReason : C.choiceText }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function KeyValue({ k, v }: { k: string; v: string }) {
  const { palette: C } = useTheme();
  return (
    <Text style={[styles.kv, { color: C.text }]}>
      <Text style={{ color: C.textSecondary }}>{k}: </Text>
      {v}
    </Text>
  );
}

const styles = StyleSheet.create({
  section: { gap: 6 },
  bordered: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 12 },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginLeft: 6 },
  card: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  note: { fontSize: 12.5, lineHeight: 17, marginHorizontal: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 15.5, fontWeight: '500' },
  rowSub: { fontSize: 12.5, lineHeight: 17, marginTop: 2 },
  btn: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 16, height: 38, justifyContent: 'center' },
  btnText: { fontSize: 14, fontWeight: '600' },
  small: { borderRadius: 16, paddingHorizontal: 12, height: 34 },
  smallText: { fontSize: 13.5 },
  kv: { fontSize: 13.5, lineHeight: 19 },
});

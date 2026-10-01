import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { SignalIcon } from '@/ui/icons';

/** "Bugün", "Dün", "12 Eylül 2026" ayracı */
export const DateChip = memo(function DateChip({ label }: { label: string }) {
  const { palette } = useTheme();
  return (
    <View style={styles.center}>
      <View style={[styles.chip, { backgroundColor: palette.dateChip, boxShadow: `0px 1px 0.5px ${palette.bubbleShadow}` }]}>
        <Text style={[styles.dateText, { color: palette.dateChipText }]}>{label}</Text>
      </View>
    </View>
  );
});

/** "Deniz'in bağlantısı koptu", "Sinyal zayıf" gibi ortada duran gri kutular */
export const SystemNotice = memo(function SystemNotice({ text, tone = 'info' }: { text: string; tone?: 'info' | 'warning' }) {
  const { palette } = useTheme();
  const warning = tone === 'warning';
  const bg = palette.systemChip;
  const fg = palette.systemChipText;
  return (
    <View style={styles.center}>
      <View style={[styles.chip, styles.system, { backgroundColor: bg }]}>
        {warning ? <SignalIcon color={palette.warningIcon} size={13} /> : null}
        <Text style={[styles.systemText, { color: fg }]}>{text}</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  center: { alignItems: 'center', marginVertical: 8, paddingHorizontal: 24 },
  chip: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5 },
  dateText: { fontSize: 12.5, fontWeight: '500' },
  system: { flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: 420 },
  systemText: { fontSize: 12.5, lineHeight: 17, textAlign: 'center', flexShrink: 1 },
});

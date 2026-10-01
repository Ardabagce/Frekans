import { StyleSheet, Text, View } from 'react-native';

import type { DeliveryStatus } from '@/chat/types';
import { formatClock } from '@/lib/time';
import { useTheme } from '@/theme/ThemeProvider';
import { Ticks } from '@/ui/icons';

type Props = {
  at: number;
  status?: DeliveryStatus;
  /** Fotoğraf üstünde: beyaz yazı, koyu yarı saydam zemin */
  overlay?: boolean;
};

/** Balonun sağ alt köşesindeki saat ve (gidenlerde) tik'ler */
export function MessageMeta({ at, status, overlay = false }: Props) {
  const { palette } = useTheme();
  const color = overlay ? '#FFFFFF' : palette.bubbleMeta;
  const tickColor = overlay ? '#FFFFFF' : status === 'read' ? palette.tickRead : palette.tickPending;
  return (
    <View style={[styles.row, overlay && styles.overlay]}>
      <Text style={[styles.time, { color }]} allowFontScaling={false}>
        {formatClock(at)}
      </Text>
      {status ? (
        <View style={styles.ticks}>
          <Ticks status={status} color={status === 'read' && overlay ? '#9ED8FF' : tickColor} />
        </View>
      ) : null}
    </View>
  );
}

const NBSP = String.fromCharCode(0xa0);

/**
 * Metnin son satırında saate yer açan görünmez dolgu. Saat balonun sağ altına
 * mutlak konumlanır; kısa satırlarda yan yana, uzunlarda bir alt satıra düşer.
 */
export function metaSpacer(withTicks: boolean): string {
  return NBSP.repeat(withTicks ? 17 : 11);
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  time: { fontSize: 11, lineHeight: 15 },
  ticks: { marginLeft: 1 },
});

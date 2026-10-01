import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';
import { BackIcon } from '@/ui/icons';

type Props = {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
  large?: boolean;
};

/** Liste ve ayarlar ekranlarının üst çubuğu */
export function AppBar({ title, onBack, right, large = false }: Props) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { backgroundColor: palette.appBar, paddingTop: insets.top }]}>
      <View style={styles.inner}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Geri"
            style={({ pressed }) => [styles.back, pressed && { opacity: 0.6 }]}
          >
            <BackIcon color={palette.appBarText} />
          </Pressable>
        ) : null}
        <Text
          style={[styles.title, large && styles.large, { color: palette.appBarText }]}
          numberOfLines={1}
          accessibilityRole="header"
        >
          {title}
        </Text>
        <View style={styles.right}>{right}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { boxShadow: '0px 1px 3px rgba(0,0,0,0.18)', zIndex: 2 },
  inner: { height: 58, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  back: { padding: 6, marginRight: 8, borderRadius: 20 },
  title: { flex: 1, fontSize: 19, fontWeight: '600', marginLeft: 6 },
  large: { fontSize: 22, fontWeight: '700', letterSpacing: 0.3 },
  right: { flexDirection: 'row', alignItems: 'center' },
});

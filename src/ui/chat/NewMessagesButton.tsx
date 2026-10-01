import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { ChevronDownIcon } from '@/ui/icons';

/**
 * Kullanıcı yukarı kaydırmışken görünür. Yeni mesaj geldiyse sayılı hap ("↓ 2 yeni mesaj"),
 * gelmediyse sadece aşağı ok.
 */
export function NewMessagesButton({ count, onPress }: { count: number; onPress: () => void }) {
  const { palette } = useTheme();
  const label = count > 0 ? `${count} yeni mesaj` : null;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label ?? 'En alta in'}
      style={({ pressed }) => [
        styles.base,
        label ? styles.pill : styles.round,
        {
          backgroundColor: palette.floatingButton,
          boxShadow: '0px 2px 6px rgba(0,0,0,0.22)',
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <ChevronDownIcon color={palette.floatingButtonText} size={20} />
      {label ? <Text style={[styles.text, { color: palette.floatingButtonText }]}>{label}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  round: { width: 40, height: 40, borderRadius: 20 },
  pill: { height: 36, borderRadius: 18, paddingLeft: 10, paddingRight: 14, gap: 4 },
  text: { fontSize: 14, fontWeight: '600' },
});

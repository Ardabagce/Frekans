import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { Wallpaper } from '@/ui/chat/Wallpaper';
import { SignalIcon } from '@/ui/icons';

/** Bilinmeyen adresler: expo-router'ın İngilizce varsayılan sayfası yerine */
export default function NotFound() {
  const router = useRouter();
  const { palette } = useTheme();
  return (
    <View style={styles.screen}>
      <Wallpaper />
      <View style={[styles.card, { backgroundColor: palette.systemChip }]}>
        <SignalIcon color={palette.warningIcon} size={20} />
        <Text style={[styles.title, { color: palette.text }]}>Bu frekans bulunamadı</Text>
        <Text style={[styles.text, { color: palette.systemChipText }]}>Aradığın sayfa yok ya da sinyal koptu.</Text>
        <Pressable
          onPress={() => router.replace('/')}
          accessibilityRole="button"
          style={({ pressed }) => [styles.btn, { backgroundColor: palette.accent, opacity: pressed ? 0.85 : 1 }]}
        >
          <Text style={styles.btnText}>Sohbetlere dön</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { borderRadius: 14, padding: 20, alignItems: 'center', gap: 8, maxWidth: 320 },
  title: { fontSize: 17, fontWeight: '700' },
  text: { fontSize: 14, textAlign: 'center' },
  btn: { marginTop: 8, borderRadius: 20, paddingHorizontal: 18, height: 40, justifyContent: 'center' },
  btnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});

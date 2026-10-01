import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Presence } from '@/chat/types';
import { formatLastSeen } from '@/lib/time';
import { useTheme } from '@/theme/ThemeProvider';
import { Avatar } from '@/ui/Avatar';
import { BackIcon } from '@/ui/icons';

type Props = {
  name: string;
  avatar: { initials: string; color: string };
  presence: Presence;
  /** Oyunun şimdiki zamanı (geliştirici saatinde gerçek saatten farklı olabilir) */
  now: number;
  onBack: () => void;
  /** Başlığa dokunma (geliştirici modu için 7 dokunuş sayacı Faz 2'de buraya bağlanır) */
  onTitlePress?: () => void;
};

export function presenceLabel(presence: Presence, now: number): string | null {
  switch (presence.kind) {
    case 'online':
      return 'çevrimiçi';
    case 'typing':
      return 'yazıyor...';
    case 'recording':
      return 'ses kaydediyor...';
    case 'lastSeen':
      return formatLastSeen(presence.at, now);
    case 'unknown':
      return null;
  }
}

export function ChatHeader({ name, avatar, presence, now, onBack, onTitlePress }: Props) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const status = presenceLabel(presence, now);

  return (
    <View style={[styles.bar, { backgroundColor: palette.appBar, paddingTop: insets.top }]}>
      <View style={styles.inner}>
        <Pressable
          onPress={onBack}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Geri"
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <BackIcon color={palette.appBarText} />
          <Avatar initials={avatar.initials} color={avatar.color} size={38} />
        </Pressable>
        <Pressable onPress={onTitlePress} style={styles.titleArea} accessibilityRole="header" testID="chat-title">
          <Text style={[styles.name, { color: palette.appBarText }]} numberOfLines={1}>
            {name}
          </Text>
          {status ? (
            <Text style={[styles.status, { color: palette.appBarSubtext }]} numberOfLines={1}>
              {status}
            </Text>
          ) : null}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { zIndex: 2, boxShadow: '0px 1px 3px rgba(0,0,0,0.18)' },
  inner: { height: 58, flexDirection: 'row', alignItems: 'center', paddingRight: 12 },
  back: { flexDirection: 'row', alignItems: 'center', paddingLeft: 6, paddingRight: 4, height: 48, borderRadius: 24, gap: 2 },
  pressed: { opacity: 0.6 },
  titleArea: { flex: 1, marginLeft: 8, justifyContent: 'center', height: 48 },
  name: { fontSize: 17, fontWeight: '600' },
  status: { fontSize: 13, marginTop: 1 },
});

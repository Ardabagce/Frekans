import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { useGame } from '@/game/registry';
import { useNow } from '@/lib/useNow';
import { useTheme } from '@/theme/ThemeProvider';
import { AppBar } from '@/ui/AppBar';
import { SettingsIcon, SignalIcon } from '@/ui/icons';
import { InstallBanner } from '@/ui/install/InstallBanner';
import { ChatListItem } from '@/ui/list/ChatListItem';
import { STORIES, type StoryEntry } from '@stories/index';

/** Oynanabilir hikaye satırı: canlı önizleme, "yazıyor..." ve okunmamış rozeti */
function PlayableRow({ entry, now }: { entry: StoryEntry; now: number }) {
  const router = useRouter();
  const { snap } = useGame(entry.id);
  const visible = snap?.view.messages.filter((m) => m.sender !== 'system') ?? [];
  const presence = snap?.view.presence.kind;
  return (
    <ChatListItem
      story={entry}
      preview={{
        last: visible[visible.length - 1],
        typing: presence === 'typing' || presence === 'recording',
        recording: presence === 'recording',
        unread: snap?.unread ?? 0,
      }}
      now={snap?.view.now ?? now}
      onPress={() => router.push({ pathname: '/chat/[storyId]', params: { storyId: entry.id } })}
    />
  );
}

export default function ChatListScreen() {
  const router = useRouter();
  const { palette } = useTheme();
  const now = useNow();

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <AppBar
        title="Frekans"
        large
        right={
          <Pressable
            onPress={() => router.push('/ayarlar')}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Ayarlar"
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
          >
            <SettingsIcon color={palette.appBarText} />
          </Pressable>
        }
      />

      <FlatList
        data={STORIES}
        keyExtractor={(s) => s.id}
        ListHeaderComponent={<InstallBanner />}
        renderItem={({ item }) =>
          !item.locked && item.story ? (
            <PlayableRow entry={item} now={now} />
          ) : (
            <ChatListItem story={item} now={now} onPress={() => {}} />
          )
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <SignalIcon color={palette.textSecondary} size={13} />
            <Text style={[styles.footerText, { color: palette.textSecondary }]}>
              Mesajlar zayıf bir frekans üzerinden iletilir
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  iconBtn: { padding: 6, borderRadius: 20 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 22 },
  footerText: { fontSize: 12.5 },
});

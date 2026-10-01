import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNow } from '@/lib/useNow';
import { useMockChat } from '@/mock/mockChat';
import { useTheme } from '@/theme/ThemeProvider';
import { SignalIcon, ThemeIcon } from '@/ui/icons';
import { ChatListItem, type ChatPreview } from '@/ui/list/ChatListItem';
import { STORIES } from '@stories/index';

const THEME_LABEL = { system: 'Tema: sistem', light: 'Tema: açık', dark: 'Tema: koyu' } as const;

export default function ChatListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { palette, preference, cyclePreference } = useTheme();
  const now = useNow();
  const chat = useMockChat();

  // Faz 1: sadece "Dağ Evi" sahte sürücüye bağlı
  const dagEviPreview = useMemo<ChatPreview>(() => {
    const visible = chat.messages.filter((m) => m.sender !== 'system');
    return {
      last: visible[visible.length - 1],
      typing: chat.presence.kind === 'typing',
      unread: chat.messages.filter((m) => m.sender === 'character' && m.at > chat.lastReadAt).length,
    };
  }, [chat]);

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <View style={[styles.appBar, { backgroundColor: palette.appBar, paddingTop: insets.top }]}>
        <View style={styles.appBarInner}>
          <Text style={[styles.title, { color: palette.appBarText }]}>Frekans</Text>
          <Pressable
            onPress={cyclePreference}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={THEME_LABEL[preference]}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
          >
            <ThemeIcon color={palette.appBarText} />
          </Pressable>
        </View>
      </View>

      <FlatList
        data={STORIES}
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => (
          <ChatListItem
            story={item}
            preview={item.id === 'dag-evi' ? dagEviPreview : undefined}
            now={now}
            onPress={() => router.push({ pathname: '/chat/[storyId]', params: { storyId: item.id } })}
          />
        )}
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
  appBar: { boxShadow: '0px 1px 3px rgba(0,0,0,0.18)', zIndex: 2 },
  appBarInner: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  title: { fontSize: 22, fontWeight: '700', letterSpacing: 0.3 },
  iconBtn: { padding: 6, borderRadius: 20 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 22 },
  footerText: { fontSize: 12.5 },
});

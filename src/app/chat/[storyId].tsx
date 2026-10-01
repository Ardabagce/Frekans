import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useNow } from '@/lib/useNow';
import { choose, markRead, useMockChat } from '@/mock/mockChat';
import { useTheme } from '@/theme/ThemeProvider';
import { ChatHeader } from '@/ui/chat/ChatHeader';
import { ChoiceBar } from '@/ui/chat/ChoiceBar';
import { MessageList } from '@/ui/chat/MessageList';
import { Wallpaper } from '@/ui/chat/Wallpaper';
import { LockIcon } from '@/ui/icons';
import { getStoryMeta } from '@stories/index';

export default function ChatScreen() {
  const { storyId } = useLocalSearchParams<{ storyId: string }>();
  const router = useRouter();
  const story = getStoryMeta(storyId ?? '');

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [router]);

  if (!story || story.locked) {
    return <LockedStory title={story?.title} onBack={goBack} />;
  }
  return <ActiveChat name={story.character.name} avatar={story.character.avatar} onBack={goBack} />;
}

function ActiveChat({
  name,
  avatar,
  onBack,
}: {
  name: string;
  avatar: { initials: string; color: string };
  onBack: () => void;
}) {
  const chat = useMockChat();
  const now = useNow();

  // Ekran açıkken gelen her mesaj okunmuş sayılır (oyuncunun tik'leri değil, liste rozeti için)
  useEffect(() => {
    markRead();
  }, [chat.messages]);

  return (
    <View style={styles.screen}>
      <ChatHeader name={name} avatar={avatar} presence={chat.presence} onBack={onBack} />
      <View style={styles.body}>
        <Wallpaper />
        <MessageList messages={chat.messages} typing={chat.presence.kind === 'typing'} now={now} />
      </View>
      <ChoiceBar choices={chat.choices} onChoose={choose} idleHint={chat.idleHint} />
    </View>
  );
}

function LockedStory({ title, onBack }: { title?: string; onBack: () => void }) {
  const { palette } = useTheme();
  return (
    <View style={styles.screen}>
      <ChatHeader
        name={title ?? 'Bilinmeyen frekans'}
        avatar={{ initials: '?', color: '#56636A' }}
        presence={{ kind: 'unknown' }}
        onBack={onBack}
      />
      <View style={styles.body}>
        <Wallpaper />
        <View style={styles.lockedCenter}>
          <View style={[styles.lockedCard, { backgroundColor: palette.systemChip }]}>
            <LockIcon color={palette.systemChipText} size={18} />
            <Text style={[styles.lockedText, { color: palette.systemChipText }]}>
              Bu frekans henüz açılmadı. Yakında biri sana ulaşacak.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { flex: 1 },
  lockedCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  lockedCard: { borderRadius: 10, padding: 16, alignItems: 'center', gap: 8, maxWidth: 320 },
  lockedText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});

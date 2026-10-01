import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { GameSnapshot, GameStore } from '@/game/GameStore';
import { useGame } from '@/game/registry';
import { useTheme } from '@/theme/ThemeProvider';
import { ChatHeader } from '@/ui/chat/ChatHeader';
import { ChoiceBar } from '@/ui/chat/ChoiceBar';
import { EndingBar } from '@/ui/chat/EndingBar';
import { MessageList } from '@/ui/chat/MessageList';
import { SystemNotice } from '@/ui/chat/Notices';
import { Wallpaper } from '@/ui/chat/Wallpaper';
import { DEV_TOOLS_ENABLED, DevPanel } from '@/ui/dev/DevPanel';
import { LockIcon } from '@/ui/icons';
import { getStoryEntry } from '@stories/index';

export default function ChatScreen() {
  const { storyId } = useLocalSearchParams<{ storyId: string }>();
  const router = useRouter();
  const entry = getStoryEntry(storyId ?? '');
  const { store, snap } = useGame(storyId ?? '');

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [router]);

  if (!entry || !store || !snap) {
    return <LockedStory title={entry?.title} onBack={goBack} />;
  }
  return <ActiveChat store={store} snap={snap} onBack={goBack} />;
}

/** Başlığa 3 sn içinde 7 dokunuş → geliştirici modu */
function useSecretTaps(count: number, windowMs: number, onUnlock: () => void) {
  const taps = useRef<number[]>([]);
  return useCallback(() => {
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < windowMs), now];
    if (taps.current.length >= count) {
      taps.current = [];
      onUnlock();
    }
  }, [count, windowMs, onUnlock]);
}

function idleHint(snap: GameSnapshot, name: string): string {
  const { view } = snap;
  if (view.draft) return 'Hikayenin devamı yakında…';
  if (view.error) return 'Bir şeyler ters gitti';
  if (view.messages.length === 0) return 'Bağlantı bekleniyor…';
  switch (view.presence.kind) {
    case 'typing':
      return `${name} yazıyor…`;
    case 'recording':
      return `${name} ses kaydediyor…`;
    case 'lastSeen':
      return `${name} çevrimdışı. Döndüğünde burada olacak.`;
    default:
      return `${name}’in cevabını bekle…`;
  }
}

function ActiveChat({ store, snap, onBack }: { store: GameStore; snap: GameSnapshot; onBack: () => void }) {
  const { view } = snap;
  const { character } = store.story;
  const [devOpen, setDevOpen] = useState(false);
  const onTitlePress = useSecretTaps(7, 3000, () => DEV_TOOLS_ENABLED && setDevOpen(true));

  // Ekran açıkken gelen her mesaj okunmuş sayılır (liste rozeti için)
  const messageCount = view.messages.length;
  useEffect(() => {
    store.markRead();
  }, [store, messageCount]);

  const typing = view.presence.kind === 'typing' || view.presence.kind === 'recording';
  const footer = view.draft ? (
    <SystemNotice text={`${character.name}’in hikayesinin devamı yazılıyor. Yeni bölüm eklendiğinde sohbet buradan devam edecek.`} />
  ) : view.error ? (
    <SystemNotice text="Hikayede bir sorun oluştu. Geliştiriciye haber verildi." tone="warning" />
  ) : null;

  return (
    <View style={styles.screen}>
      <ChatHeader
        name={character.name}
        avatar={character.avatar}
        presence={view.presence}
        now={view.now}
        onBack={onBack}
        onTitlePress={onTitlePress}
      />
      <View style={styles.body}>
        <Wallpaper />
        <MessageList
          messages={view.messages}
          typing={typing}
          now={view.now}
          footer={footer}
          pinKey={view.ending?.id ?? null}
        />
      </View>
      {view.ending ? (
        <EndingBar
          ending={view.ending}
          endingsSeen={snap.endingsSeen.length}
          endingsTotal={Object.keys(store.story.endings).length}
          onRestart={() => store.restart()}
        />
      ) : (
        <ChoiceBar choices={view.choices} onChoose={(id) => store.choose(id)} idleHint={idleHint(snap, character.name)} />
      )}
      {DEV_TOOLS_ENABLED && devOpen ? (
        <DevPanel visible={devOpen} onClose={() => setDevOpen(false)} store={store} snap={snap} />
      ) : null}
    </View>
  );
}

function LockedStory({ title, onBack }: { title?: string; onBack: () => void }) {
  const { palette } = useTheme();
  const [openedAt] = useState(() => Date.now());
  return (
    <View style={styles.screen}>
      <ChatHeader
        name={title ?? 'Bilinmeyen frekans'}
        avatar={{ initials: '?', color: '#56636A' }}
        presence={{ kind: 'unknown' }}
        now={openedAt}
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

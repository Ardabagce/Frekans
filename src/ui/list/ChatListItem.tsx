import { memo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ChatMessage, DeliveryStatus } from '@/chat/types';
import type { StoryMeta } from '@/engine/meta';
import { formatDuration, formatListTime } from '@/lib/time';
import { useTheme } from '@/theme/ThemeProvider';
import { Avatar } from '@/ui/Avatar';
import { BanIcon, CameraIcon, LockIcon, MicIcon, PinIcon, Ticks } from '@/ui/icons';

export type ChatPreview = {
  last?: ChatMessage;
  typing: boolean;
  unread: number;
};

type Props = {
  story: StoryMeta;
  preview?: ChatPreview;
  now: number;
  onPress: () => void;
};

function previewParts(msg: ChatMessage, color: string): { icon?: ReactNode; text: string } {
  const c = msg.content;
  switch (c.kind) {
    case 'text':
      return { text: c.text };
    case 'voice':
      return { icon: <MicIcon color={color} size={15} />, text: `Sesli mesaj (${formatDuration(c.durationSec)})` };
    case 'photo':
      return { icon: <CameraIcon color={color} size={15} />, text: c.caption ?? 'Fotoğraf' };
    case 'location':
      return { icon: <PinIcon color={color} size={15} />, text: 'Konum' };
    case 'deleted':
      return { icon: <BanIcon color={color} size={14} />, text: 'Bu mesaj silindi' };
    case 'system':
      return { text: c.text };
  }
}

function ChatListItemImpl({ story, preview, now, onPress }: Props) {
  const { palette } = useTheme();
  const { character, locked } = story;
  const last = preview?.last;
  const unread = preview?.unread ?? 0;

  let line: ReactNode;
  if (locked) {
    line = (
      <View style={styles.previewRow}>
        <LockIcon color={palette.textSecondary} size={13} />
        <Text style={[styles.preview, { color: palette.textSecondary }]} numberOfLines={1}>
          Yakında · {story.teaser ?? story.title}
        </Text>
      </View>
    );
  } else if (preview?.typing) {
    line = <Text style={[styles.preview, { color: palette.accent }]}>yazıyor...</Text>;
  } else if (last) {
    const { icon, text } = previewParts(last, palette.textSecondary);
    const status: DeliveryStatus | undefined = last.sender === 'player' ? last.status : undefined;
    line = (
      <View style={styles.previewRow}>
        {status ? <Ticks status={status} color={status === 'read' ? palette.tickRead : palette.tickPending} /> : null}
        {icon}
        <Text
          style={[styles.preview, { color: palette.textSecondary }, last.content.kind === 'deleted' && styles.italic]}
          numberOfLines={1}
        >
          {text}
        </Text>
      </View>
    );
  } else {
    line = <Text style={[styles.preview, { color: palette.textSecondary }]}> </Text>;
  }

  return (
    <Pressable
      onPress={locked ? undefined : onPress}
      disabled={locked}
      accessibilityRole="button"
      accessibilityLabel={locked ? `${story.title}, yakında` : `${character.name} ile sohbet`}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: palette.divider }]}
    >
      <Avatar initials={character.avatar.initials} color={character.avatar.color} size={50} dimmed={locked} />
      <View style={[styles.body, { borderBottomColor: palette.divider }]}>
        <View style={styles.topRow}>
          <Text
            style={[styles.name, { color: locked ? palette.textSecondary : palette.text }]}
            numberOfLines={1}
          >
            {character.name}
          </Text>
          {last && !locked ? (
            <Text style={[styles.time, { color: unread > 0 ? palette.badge : palette.textSecondary }]}>
              {formatListTime(last.at, now)}
            </Text>
          ) : null}
        </View>
        <View style={styles.bottomRow}>
          <View style={styles.previewWrap}>{line}</View>
          {unread > 0 && !locked ? (
            <View style={[styles.badge, { backgroundColor: palette.badge }]}>
              <Text style={[styles.badgeText, { color: palette.badgeText }]}>{unread > 99 ? '99+' : unread}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export const ChatListItem = memo(ChatListItemImpl);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingLeft: 14 },
  body: {
    flex: 1,
    marginLeft: 14,
    paddingVertical: 13,
    paddingRight: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { fontSize: 16.5, fontWeight: '600', flexShrink: 1 },
  time: { fontSize: 12 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 8 },
  previewWrap: { flex: 1 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  preview: { fontSize: 14.5, flexShrink: 1 },
  italic: { fontStyle: 'italic' },
  badge: {
    minWidth: 21,
    height: 21,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 12, fontWeight: '700' },
});

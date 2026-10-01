import { memo, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { ChatMessage } from '@/chat/types';
import { useTheme } from '@/theme/ThemeProvider';
import { BanIcon } from '@/ui/icons';

import { BubbleTail, TAIL_WIDTH } from './BubbleTail';
import { LocationContent } from './content/LocationContent';
import { PhotoContent } from './content/PhotoContent';
import { VoiceContent } from './content/VoiceContent';
import { MessageMeta, metaSpacer } from './MessageMeta';

type Props = {
  message: ChatMessage;
  firstInGroup: boolean;
  lastInGroup: boolean;
};

/** Gelen ve giden balonlar. Sistem mesajları SystemNotice ile çizilir. */
function MessageBubbleImpl({ message, firstInGroup, lastInGroup }: Props) {
  const { palette } = useTheme();
  const outgoing = message.sender === 'player';
  const bg = outgoing ? palette.bubbleOut : palette.bubbleIn;
  const { content } = message;
  const spacer = metaSpacer(Boolean(message.status));
  const meta = <MessageMeta at={message.at} status={message.status} />;

  let body: ReactNode;
  let metaInline = true; // saat sağ alta mutlak konumlanır
  let padded = true;

  switch (content.kind) {
    case 'text':
      body = (
        <Text style={[styles.text, { color: palette.text }]}>
          {content.text}
          <Text style={styles.spacer}>{spacer}</Text>
        </Text>
      );
      break;
    case 'deleted':
      body = (
        <View style={styles.deletedRow}>
          <BanIcon color={palette.textSecondary} />
          <Text style={[styles.text, styles.deleted, { color: palette.textSecondary }]}>
            {outgoing ? 'Bu mesajı sildin' : 'Bu mesaj silindi'}
            <Text style={styles.spacer}>{spacer}</Text>
          </Text>
        </View>
      );
      break;
    case 'voice':
      body = (
        <VoiceContent id={message.id} durationSec={content.durationSec} transcript={content.transcript} outgoing={outgoing} />
      );
      break;
    case 'photo':
      padded = false;
      if (content.caption) {
        body = <PhotoContent image={content.image} caption={content.caption} captionSuffix={spacer} />;
      } else {
        metaInline = false;
        body = (
          <PhotoContent
            image={content.image}
            metaOverlay={<MessageMeta at={message.at} status={message.status} overlay />}
          />
        );
      }
      break;
    case 'location':
      padded = false;
      body = <LocationContent label={content.label} lat={content.lat} lng={content.lng} />;
      break;
    case 'system':
      return null;
  }

  return (
    <View
      style={[
        styles.row,
        outgoing ? styles.rowOut : styles.rowIn,
        { marginTop: firstInGroup ? 6 : 2, marginBottom: lastInGroup ? 2 : 0 },
      ]}
    >
      <View
        style={[
          styles.bubble,
          padded ? styles.padded : styles.mediaPadded,
          {
            backgroundColor: bg,
            boxShadow: `0px 1px 0.5px ${palette.bubbleShadow}`,
          },
          firstInGroup && (outgoing ? styles.tailRight : styles.tailLeft),
        ]}
      >
        {firstInGroup ? <BubbleTail side={outgoing ? 'right' : 'left'} color={bg} /> : null}
        {body}
        {metaInline ? <View style={[styles.meta, !padded && styles.metaMedia]}>{meta}</View> : null}
      </View>
    </View>
  );
}

export const MessageBubble = memo(MessageBubbleImpl);

const styles = StyleSheet.create({
  row: { paddingHorizontal: 8 + TAIL_WIDTH, flexDirection: 'row' },
  rowIn: { justifyContent: 'flex-start' },
  rowOut: { justifyContent: 'flex-end' },
  bubble: { borderRadius: 8, maxWidth: '82%', minWidth: 64 },
  tailLeft: { borderTopLeftRadius: 0 },
  tailRight: { borderTopRightRadius: 0 },
  padded: { paddingHorizontal: 9, paddingTop: 6, paddingBottom: 8 },
  mediaPadded: { padding: 3 },
  text: { fontSize: 15.5, lineHeight: 21 },
  spacer: { fontSize: 15.5 },
  deletedRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  deleted: { fontStyle: 'italic' },
  meta: { position: 'absolute', right: 8, bottom: 4 },
  metaMedia: { right: 7, bottom: 4 },
});

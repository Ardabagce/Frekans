import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type ListRenderItem,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { buildChatRows, type ChatRow } from '@/chat/buildItems';
import type { ChatMessage } from '@/chat/types';

import { MessageBubble } from './MessageBubble';
import { NewMessagesButton } from './NewMessagesButton';
import { DateChip, SystemNotice } from './Notices';
import { TypingBubble } from './TypingBubble';

type Props = {
  messages: ChatMessage[];
  typing: boolean;
  now: number;
};

/** En alta bu kadar pikselden yakınsa "en altta" sayılır */
const BOTTOM_THRESHOLD = 72;
/** Programatik kaydırma bitmediyse bu süreden sonra yine de kullanıcı kontrolüne bırak */
const AUTO_SCROLL_GRACE_MS = 700;

/**
 * Sohbet akışı.
 * - Kullanıcı en alttaysa: yeni mesaj, yazıyor balonu veya alt çubuğun büyümesi listeyi en altta tutar.
 * - Kullanıcı yukarı kaydırmışsa: otomatik kaydırma yapılmaz, "↓ yeni mesaj" butonu çıkar.
 * - Oyuncu bir seçim yaptığında her durumda en alta inilir.
 */
export function MessageList({ messages, typing, now }: Props) {
  const listRef = useRef<FlatList<ChatRow>>(null);
  const stickRef = useRef(true);
  const autoScrollUntilRef = useRef(0);
  const prevLenRef = useRef(messages.length);
  const [detached, setDetached] = useState(false);
  const [unseen, setUnseen] = useState(0);

  const rows = useMemo(() => buildChatRows(messages, now), [messages, now]);
  const lastSender = messages[messages.length - 1]?.sender;

  const scrollToEnd = useCallback((animated: boolean) => {
    autoScrollUntilRef.current = Date.now() + AUTO_SCROLL_GRACE_MS;
    listRef.current?.scrollToEnd({ animated });
  }, []);

  const attach = useCallback(() => {
    stickRef.current = true;
    setDetached(false);
    setUnseen(0);
  }, []);

  // Yeni mesaj geldiğinde: oyuncunun kendi mesajıysa en alta in; değilse ve kullanıcı yukarıdaysa say.
  useEffect(() => {
    const prev = prevLenRef.current;
    prevLenRef.current = messages.length;
    if (messages.length < prev) {
      // Sohbet sıfırlandı
      attach();
      return;
    }
    if (messages.length === prev) return;
    const added = messages.slice(prev);
    if (added.some((m) => m.sender === 'player')) {
      attach();
      scrollToEnd(true);
      return;
    }
    if (!stickRef.current) {
      setUnseen((u) => u + added.length);
    }
  }, [messages, attach, scrollToEnd]);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      const distance = contentSize.height - layoutMeasurement.height - contentOffset.y;
      const atBottom = distance < BOTTOM_THRESHOLD;
      if (atBottom) {
        autoScrollUntilRef.current = 0;
        if (!stickRef.current || unseen > 0) attach();
        return;
      }
      // Kendi başlattığımız kaydırma sürerken ara konumlar kullanıcı niyeti sayılmaz.
      if (Date.now() < autoScrollUntilRef.current) return;
      if (stickRef.current) {
        stickRef.current = false;
        setDetached(true);
      }
    },
    [attach, unseen],
  );

  const onBeginDrag = useCallback(() => {
    // Kullanıcı parmağıyla tuttu: programatik kaydırmanın koruma süresi biter.
    autoScrollUntilRef.current = 0;
  }, []);

  const firstLayoutDone = useRef(false);
  const onContentSizeChange = useCallback(() => {
    if (!stickRef.current) return;
    scrollToEnd(firstLayoutDone.current);
    firstLayoutDone.current = true;
  }, [scrollToEnd]);

  // Alt çubuk (seçimler) büyüyüp küçüldüğünde görünür alan değişir.
  const onLayout = useCallback(
    (_e: LayoutChangeEvent) => {
      if (stickRef.current) scrollToEnd(false);
    },
    [scrollToEnd],
  );

  const renderItem: ListRenderItem<ChatRow> = useCallback(({ item }) => {
    if (item.type === 'date') return <DateChip label={item.label} />;
    const { message } = item;
    if (message.content.kind === 'system') {
      return <SystemNotice text={message.content.text} tone={message.content.tone} />;
    }
    return <MessageBubble message={message} firstInGroup={item.firstInGroup} lastInGroup={item.lastInGroup} />;
  }, []);

  return (
    <View style={styles.wrap}>
      <FlatList
        ref={listRef}
        data={rows}
        keyExtractor={(r) => r.key}
        renderItem={renderItem}
        onScroll={onScroll}
        onScrollBeginDrag={onBeginDrag}
        scrollEventThrottle={32}
        onContentSizeChange={onContentSizeChange}
        onLayout={onLayout}
        initialNumToRender={40}
        maxToRenderPerBatch={30}
        windowSize={21}
        ListHeaderComponent={<View style={styles.top} />}
        ListFooterComponent={
          <View style={styles.bottom}>{typing ? <TypingBubble withTail={lastSender !== 'character'} /> : null}</View>
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
      {detached ? (
        <View
          pointerEvents="box-none"
          style={[styles.jumpWrap, { alignItems: unseen > 0 ? 'center' : 'flex-end' }]}
        >
          <NewMessagesButton
            count={unseen}
            onPress={() => {
              attach();
              scrollToEnd(true);
            }}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  top: { height: 8 },
  bottom: { paddingBottom: 8 },
  jumpWrap: { position: 'absolute', left: 0, right: 0, bottom: 12, paddingHorizontal: 12 },
});

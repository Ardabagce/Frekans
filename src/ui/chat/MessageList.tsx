import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type ListRenderItem,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { buildChatRows, continuesGroup, type ChatRow } from '@/chat/buildItems';
import type { ChatMessage } from '@/chat/types';

import { MessageBubble } from './MessageBubble';
import { NewMessagesButton } from './NewMessagesButton';
import { DateChip, SystemNotice } from './Notices';
import { TypingBubble } from './TypingBubble';

type Props = {
  messages: ChatMessage[];
  typing: boolean;
  now: number;
  /** Listenin en altında (yazıyor balonundan önce) gösterilecek ek içerik, ör. "devamı yakında" notu */
  footer?: ReactNode;
  /** Değişince (ör. son kartı çıkınca) liste en alta sabitlenir */
  pinKey?: string | null;
};

/** En alta bu kadar pikselden yakınsa "en altta" sayılır */
const BOTTOM_THRESHOLD = 72;
/** Programatik kaydırma bitmediyse bu süreden sonra yine de kullanıcı kontrolüne bırak */
const AUTO_SCROLL_GRACE_MS = 700;
/** Açılışta liste yerleşirken: kaydırmalar animasyonsuz, ara konumlar kullanıcı niyeti sayılmaz */
const SETTLE_MS = 2000;
/** Alt çubuk yüksekliği değiştikten sonra bu süre içindeki kaymalar kullanıcı niyeti sayılmaz */
const LAYOUT_GRACE_MS = 450;

/**
 * Sohbet akışı.
 * - Kullanıcı en alttaysa: yeni mesaj, yazıyor balonu veya alt çubuğun büyümesi listeyi en altta tutar.
 * - Kullanıcı yukarı kaydırmışsa: otomatik kaydırma yapılmaz, "↓ yeni mesaj" butonu çıkar.
 * - Oyuncu bir seçim yaptığında her durumda en alta inilir.
 */
export function MessageList({ messages, typing, now, footer, pinKey }: Props) {
  const listRef = useRef<FlatList<ChatRow>>(null);
  const stickRef = useRef(true);
  const autoScrollUntilRef = useRef(0);
  const prevLenRef = useRef(messages.length);
  const [detached, setDetached] = useState(false);
  const [unseen, setUnseen] = useState(0);
  const [mountedAt] = useState(() => Date.now());
  const layoutChangedAtRef = useRef(0);
  // Uzun sohbet en alttan açılsın diye ilk çizimde (makul bir sınıra kadar) tüm satırları çiz
  const [initialCount] = useState(() => Math.min(Math.max(messages.length + 20, 40), 400));

  const rows = useMemo(() => buildChatRows(messages, now), [messages, now]);
  // Yazıyor balonu, yerine gelecek mesajla aynı gruplama kuralıyla kuyruk alır
  const last = messages[messages.length - 1];
  const typingTail = !continuesGroup(last, { sender: 'character', at: now });

  const scrollToEnd = useCallback((animated: boolean) => {
    autoScrollUntilRef.current = Date.now() + AUTO_SCROLL_GRACE_MS;
    // FlatList.scrollToEnd hedefi önbellekteki satır yüksekliklerinden hesaplar; yeni eklenen ya da
    // büyüyen satır henüz ölçülmemişse kısa kalır. Alttaki ScrollView gerçek içerik yüksekliğini kullanır.
    const scroller = listRef.current?.getNativeScrollRef() as unknown as {
      scrollToEnd?: (o: { animated: boolean }) => void;
    } | null;
    if (scroller?.scrollToEnd) scroller.scrollToEnd({ animated });
    else listRef.current?.scrollToEnd({ animated });
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
      // Kendi başlattığımız kaydırma, açılıştaki yerleşme ya da alt çubuğun boyut değişimi sürerken
      // ara konumlar kullanıcı niyeti sayılmaz.
      const now = Date.now();
      if (now < autoScrollUntilRef.current) return;
      if (now - mountedAt < SETTLE_MS || now - layoutChangedAtRef.current < LAYOUT_GRACE_MS) return;
      if (stickRef.current) {
        stickRef.current = false;
        setDetached(true);
      }
    },
    [attach, unseen, mountedAt],
  );

  const onBeginDrag = useCallback(() => {
    // Kullanıcı parmağıyla tuttu: programatik kaydırmanın koruma süresi biter.
    autoScrollUntilRef.current = 0;
  }, []);

  const firstLayoutDone = useRef(false);
  const onContentSizeChange = useCallback(() => {
    if (!stickRef.current) return;
    const settling = Date.now() - mountedAt < SETTLE_MS;
    scrollToEnd(firstLayoutDone.current && !settling);
    firstLayoutDone.current = true;
  }, [scrollToEnd, mountedAt]);

  // Alt çubuk (seçimler) büyüyüp küçüldüğünde görünür alan değişir.
  const onLayout = useCallback(
    (_e: LayoutChangeEvent) => {
      layoutChangedAtRef.current = Date.now();
      if (stickRef.current) scrollToEnd(false);
    },
    [scrollToEnd],
  );

  // Son kartı gibi alt çubuğu büyüten bir değişimde son mesajlar kartın altında kalmasın
  useEffect(() => {
    if (!pinKey) return;
    stickRef.current = true;
    scrollToEnd(false);
    const timers = [0, 150, 500, 1000].map((ms) =>
      setTimeout(() => {
        if (ms === 0) attach();
        scrollToEnd(false);
      }, ms),
    );
    return () => timers.forEach(clearTimeout);
  }, [pinKey, attach, scrollToEnd]);

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
        initialNumToRender={initialCount}
        maxToRenderPerBatch={30}
        windowSize={21}
        ListHeaderComponent={<View style={styles.top} />}
        ListFooterComponent={
          <View style={styles.bottom}>
            {footer}
            {typing ? <TypingBubble withTail={typingTail} /> : null}
          </View>
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

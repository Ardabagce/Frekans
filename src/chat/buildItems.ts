import { formatDateSeparator, isSameLocalDay } from '@/lib/time';

import type { ChatMessage } from './types';

export type ChatRow =
  | { type: 'date'; key: string; label: string }
  | {
      type: 'message';
      key: string;
      message: ChatMessage;
      /** Grubun ilk balonu kuyruklu çizilir */
      firstInGroup: boolean;
      /** Grubun son balonundan sonra daha geniş boşluk bırakılır */
      lastInGroup: boolean;
    };

/** Aynı göndericiden gelen ardışık mesajlar bu süre içindeyse aynı gruba girer */
export const GROUP_WINDOW_MS = 5 * 60_000;

function continuesGroup(prev: ChatMessage | undefined, msg: ChatMessage): boolean {
  if (!prev) return false;
  if (prev.sender === 'system' || msg.sender === 'system') return false;
  if (prev.sender !== msg.sender) return false;
  if (!isSameLocalDay(prev.at, msg.at)) return false;
  return msg.at - prev.at <= GROUP_WINDOW_MS;
}

/**
 * Mesaj dizisini (zamana göre sıralı) liste satırlarına çevirir:
 * gün değişiminde tarih ayracı ekler, balon gruplarını işaretler.
 */
export function buildChatRows(messages: readonly ChatMessage[], now: number): ChatRow[] {
  const rows: ChatRow[] = [];
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]!;
    const prev = messages[i - 1];
    const next = messages[i + 1];

    if (!prev || !isSameLocalDay(prev.at, msg.at)) {
      rows.push({ type: 'date', key: `date-${msg.id}`, label: formatDateSeparator(msg.at, now) });
    }

    rows.push({
      type: 'message',
      key: msg.id,
      message: msg,
      firstInGroup: !continuesGroup(prev, msg),
      lastInGroup: !next || !continuesGroup(msg, next),
    });
  }
  return rows;
}

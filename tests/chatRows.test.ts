import { describe, expect, it } from 'vitest';

import { buildChatRows } from '@/chat/buildItems';
import type { ChatMessage } from '@/chat/types';
import { typingDurationMs, TYPING_MAX_MS, TYPING_MIN_MS } from '@/chat/typing';

const local = (d: number, h: number, mi: number) => new Date(2026, 8, d, h, mi).getTime();
let n = 0;
const msg = (sender: ChatMessage['sender'], at: number): ChatMessage => ({
  id: `t${++n}`,
  sender,
  at,
  content: sender === 'system' ? { kind: 'system', text: 'Sinyal zayıf' } : { kind: 'text', text: 'x' },
});

describe('buildChatRows', () => {
  const now = local(30, 20, 0);

  it('her yeni günün başına tarih ayracı koyar', () => {
    const rows = buildChatRows([msg('character', local(29, 10, 0)), msg('character', local(30, 9, 0))], now);
    expect(rows.map((r) => r.type)).toEqual(['date', 'message', 'date', 'message']);
    expect(rows[0]).toMatchObject({ label: 'Dün' });
    expect(rows[2]).toMatchObject({ label: 'Bugün' });
  });

  it('aynı göndericinin yakın mesajlarını gruplar, sadece ilki kuyruklu', () => {
    const rows = buildChatRows(
      [
        msg('character', local(30, 9, 0)),
        msg('character', local(30, 9, 1)),
        msg('player', local(30, 9, 2)),
        msg('character', local(30, 9, 30)), // 5 dk penceresi dışında değil ama gönderici değişti
      ],
      now,
    ).filter((r) => r.type === 'message');
    expect(rows.map((r) => r.type === 'message' && r.firstInGroup)).toEqual([true, false, true, true]);
    expect(rows.map((r) => r.type === 'message' && r.lastInGroup)).toEqual([false, true, true, true]);
  });

  it('5 dakikadan uzun ara grubu böler; sistem mesajı da böler', () => {
    const rows = buildChatRows(
      [
        msg('character', local(30, 9, 0)),
        msg('character', local(30, 9, 10)),
        msg('system', local(30, 9, 11)),
        msg('character', local(30, 9, 12)),
      ],
      now,
    ).filter((r) => r.type === 'message');
    expect(rows.map((r) => r.type === 'message' && r.firstInGroup)).toEqual([true, true, true, true]);
  });
});

describe('typingDurationMs', () => {
  it('uzunlukla artar, alt ve üst sınırla kırpılır', () => {
    expect(typingDurationMs('ok')).toBe(TYPING_MIN_MS);
    expect(typingDurationMs('x'.repeat(500))).toBe(TYPING_MAX_MS);
    expect(typingDurationMs('x'.repeat(40))).toBeGreaterThan(typingDurationMs('x'.repeat(20)));
  });
});

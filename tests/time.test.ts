import { describe, expect, it } from 'vitest';

import {
  calendarDayDiff,
  formatClock,
  formatDateSeparator,
  formatDuration,
  formatLastSeen,
  formatListTime,
} from '@/lib/time';

const local = (y: number, mo: number, d: number, h = 12, mi = 0) => new Date(y, mo - 1, d, h, mi).getTime();

describe('formatClock', () => {
  it('saat ve dakikayı iki haneli yazar', () => {
    expect(formatClock(local(2026, 10, 1, 9, 5))).toBe('09:05');
    expect(formatClock(local(2026, 10, 1, 23, 59))).toBe('23:59');
  });
});

describe('calendarDayDiff', () => {
  it('saat farkına değil takvim gününe bakar', () => {
    expect(calendarDayDiff(local(2026, 10, 1, 23, 59), local(2026, 10, 2, 0, 1))).toBe(1);
    expect(calendarDayDiff(local(2026, 10, 1, 0, 1), local(2026, 10, 1, 23, 59))).toBe(0);
  });
});

describe('formatDateSeparator', () => {
  const now = local(2026, 10, 1, 14, 0); // 1 Ekim 2026 Perşembe
  it('Bugün / Dün', () => {
    expect(formatDateSeparator(local(2026, 10, 1, 0, 5), now)).toBe('Bugün');
    expect(formatDateSeparator(local(2026, 9, 30, 23, 50), now)).toBe('Dün');
  });
  it('daha eskisi için tam tarih (gün adı değil)', () => {
    expect(formatDateSeparator(local(2026, 9, 29), now)).toBe('29 Eylül 2026');
    expect(formatDateSeparator(local(2026, 9, 24), now)).toBe('24 Eylül 2026');
  });
});

describe('formatLastSeen', () => {
  const now = local(2026, 10, 1, 14, 0);
  it('bugün ve dün', () => {
    expect(formatLastSeen(local(2026, 10, 1, 13, 2), now)).toBe('son görülme bugün 13:02');
    expect(formatLastSeen(local(2026, 9, 30, 23, 10), now)).toBe('son görülme dün 23:10');
  });
  it('daha eski: gün ve ay; yıl farklıysa yıl da', () => {
    expect(formatLastSeen(local(2026, 9, 28, 8, 0), now)).toBe('son görülme 28 Eylül 08:00');
    expect(formatLastSeen(local(2025, 12, 31, 22, 0), now)).toBe('son görülme 31 Aralık 2025 22:00');
  });
});

describe('formatListTime', () => {
  const now = local(2026, 10, 1, 14, 0);
  it('bugün saat, dün "Dün", hafta içi gün adı, eskisi tarih', () => {
    expect(formatListTime(local(2026, 10, 1, 8, 30), now)).toBe('08:30');
    expect(formatListTime(local(2026, 9, 30), now)).toBe('Dün');
    expect(formatListTime(local(2026, 9, 27), now)).toBe('Pazar');
    expect(formatListTime(local(2026, 9, 2), now)).toBe('02.09.2026');
  });
});

describe('formatDuration', () => {
  it('dakika:saniye', () => {
    expect(formatDuration(9)).toBe('0:09');
    expect(formatDuration(65)).toBe('1:05');
    expect(formatDuration(-3)).toBe('0:00');
  });
});

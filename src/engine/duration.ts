import type { Duration } from './types';

export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

const UNIT: Record<string, number> = { ms: 1, s: SECOND, m: MINUTE, h: HOUR, d: DAY };
const PART = /(\d+(?:\.\d+)?)(ms|s|m|h|d)/g;

/** "1h30m" → 5_400_000. Sayı verilirse milisaniye kabul edilir. Geçersiz metin hata fırlatır. */
export function toMs(d: Duration): number {
  if (typeof d === 'number') {
    if (!Number.isFinite(d) || d < 0) throw new Error(`Geçersiz süre: ${d}`);
    return d;
  }
  const s = d.replace(/\s+/g, '');
  let total = 0;
  let consumed = 0;
  for (const m of s.matchAll(PART)) {
    total += Number(m[1]) * UNIT[m[2]!]!;
    consumed += m[0].length;
  }
  if (consumed === 0 || consumed !== s.length) throw new Error(`Geçersiz süre: "${d}"`);
  return Math.round(total);
}

export function isValidDuration(d: Duration): boolean {
  try {
    toMs(d);
    return true;
  } catch {
    return false;
  }
}

/** 95_000 → "1 dk 35 sn", 2 gün 3 saat → "2 gün 3 sa" */
export function formatSpan(ms: number): string {
  if (ms < MINUTE) return `${Math.round(ms / SECOND)} sn`;
  const d = Math.floor(ms / DAY);
  const h = Math.floor((ms % DAY) / HOUR);
  const m = Math.floor((ms % HOUR) / MINUTE);
  const s = Math.round((ms % MINUTE) / SECOND);
  const parts: string[] = [];
  if (d) parts.push(`${d} gün`);
  if (h) parts.push(`${h} sa`);
  if (m && d === 0) parts.push(`${m} dk`);
  if (s && d === 0 && h === 0) parts.push(`${s} sn`);
  return parts.join(' ') || '0 sn';
}

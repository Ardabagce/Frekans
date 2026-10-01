/**
 * Yerel saat dilimine bağlı hesaplar. Hikaye "sabah 08:00" dediğinde
 * oyuncunun telefonundaki saate göre bir sonraki 08:00 kastedilir.
 */
import type { ClockTime, TimeOfDay } from './types';

const CLOCK_RE = /^([01]?\d|2[0-3]):([0-5]\d)$/;

export function isValidClock(c: string): c is ClockTime {
  return CLOCK_RE.test(c);
}

/** "08:30" → 510 (gece yarısından itibaren dakika) */
export function clockToMinutes(c: ClockTime | string): number {
  const m = CLOCK_RE.exec(c);
  if (!m) throw new Error(`Geçersiz saat: "${c}" (HH:MM bekleniyor)`);
  return Number(m[1]) * 60 + Number(m[2]);
}

export function minutesOfDay(ts: number): number {
  const d = new Date(ts);
  return d.getHours() * 60 + d.getMinutes();
}

/**
 * `ts`'den kesinlikle SONRAKİ ilk yerel `clock` anı.
 * Yaz saati geçişlerinde de doğru: takvim günü üzerinden kurulur.
 */
export function nextOccurrence(ts: number, clock: ClockTime | string): number {
  const mins = clockToMinutes(clock);
  const d = new Date(ts);
  const candidate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), Math.floor(mins / 60), mins % 60, 0, 0);
  if (candidate.getTime() > ts) return candidate.getTime();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, Math.floor(mins / 60), mins % 60, 0, 0).getTime();
}

/** [from, to) aralığında mı? Gece yarısını aşan aralıklar (22:00–06:00) desteklenir. */
export function inClockWindow(ts: number, from: ClockTime | string, to: ClockTime | string): boolean {
  const m = minutesOfDay(ts);
  const a = clockToMinutes(from);
  const b = clockToMinutes(to);
  if (a === b) return true;
  return a < b ? m >= a && m < b : m >= a || m < b;
}

export function timeOfDay(ts: number): TimeOfDay {
  const h = new Date(ts).getHours();
  if (h >= 6 && h < 12) return 'sabah';
  if (h >= 12 && h < 17) return 'ogle';
  if (h >= 17 && h < 22) return 'aksam';
  return 'gece';
}

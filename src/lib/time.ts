/**
 * Türkçe zaman biçimlendirme. Hepsi cihazın yerel saat dilimini kullanır.
 * Intl'e bağımlı değil: Hermes ve tüm tarayıcılarda aynı çıktıyı verir.
 */

export const MONTHS_TR = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
] as const;

/** Date.getDay() sırasıyla (0 = Pazar) */
export const WEEKDAYS_TR = [
  'Pazar',
  'Pazartesi',
  'Salı',
  'Çarşamba',
  'Perşembe',
  'Cuma',
  'Cumartesi',
] as const;

const pad2 = (n: number) => (n < 10 ? `0${n}` : String(n));

/** Yerel günün başlangıcı (00:00) */
export function startOfLocalDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * İki an arasındaki takvim günü farkı (b - a). Yaz saati geçişlerinde
 * 23/25 saatlik günlerden etkilenmemek için yuvarlanır.
 */
export function calendarDayDiff(a: number, b: number): number {
  return Math.round((startOfLocalDay(b) - startOfLocalDay(a)) / 86_400_000);
}

export function isSameLocalDay(a: number, b: number): boolean {
  return startOfLocalDay(a) === startOfLocalDay(b);
}

/** "14:32" */
export function formatClock(ts: number): string {
  const d = new Date(ts);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** "12 Eylül 2026" */
export function formatLongDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getDate()} ${MONTHS_TR[d.getMonth()]} ${d.getFullYear()}`;
}

/** Sohbetteki tarih ayracı: "Bugün", "Dün", daha eskisi için tam tarih ("29 Eylül 2026") */
export function formatDateSeparator(ts: number, now: number): string {
  const diff = calendarDayDiff(ts, now);
  if (diff <= 0) return 'Bugün';
  if (diff === 1) return 'Dün';
  return formatLongDate(ts);
}

/** Başlık durum satırı: "son görülme bugün 14:32" / "son görülme dün 23:10" / "son görülme 28 Eylül 14:32" */
export function formatLastSeen(ts: number, now: number): string {
  const diff = calendarDayDiff(ts, now);
  const clock = formatClock(ts);
  if (diff <= 0) return `son görülme bugün ${clock}`;
  if (diff === 1) return `son görülme dün ${clock}`;
  const d = new Date(ts);
  const sameYear = d.getFullYear() === new Date(now).getFullYear();
  const date = sameYear ? `${d.getDate()} ${MONTHS_TR[d.getMonth()]}` : formatLongDate(ts);
  return `son görülme ${date} ${clock}`;
}

/** Sohbet listesindeki saat sütunu: bugün "14:32", dün "Dün", bu hafta gün adı, daha eski "28.09.2026" */
export function formatListTime(ts: number, now: number): string {
  const diff = calendarDayDiff(ts, now);
  if (diff <= 0) return formatClock(ts);
  if (diff === 1) return 'Dün';
  if (diff < 7) return WEEKDAYS_TR[new Date(ts).getDay()] ?? formatClock(ts);
  const d = new Date(ts);
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
}

/** Sesli mesaj süresi: "0:14", "1:05" */
export function formatDuration(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  return `${Math.floor(s / 60)}:${pad2(s % 60)}`;
}

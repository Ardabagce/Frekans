/**
 * "Yazıyor..." süresi mesaj uzunluğuyla orantılıdır.
 * Panik halinde, telefonda hızlı yazan biri: ~55 ms/karakter, kısa mesajlarda
 * bile en az ~1.2 sn, uzunlarda en fazla 7 sn.
 */
export const TYPING_MS_PER_CHAR = 55;
export const TYPING_BASE_MS = 700;
export const TYPING_MIN_MS = 1200;
export const TYPING_MAX_MS = 7000;

export function typingDurationMs(text: string): number {
  const ms = TYPING_BASE_MS + text.trim().length * TYPING_MS_PER_CHAR;
  return Math.min(TYPING_MAX_MS, Math.max(TYPING_MIN_MS, Math.round(ms)));
}

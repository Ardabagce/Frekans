/**
 * Kayıt biçimi. Sohbetin kendisi saklanmaz: yalnızca başlangıç anı ve oyuncunun
 * (seçim, zaman) dizisi saklanır, sohbet motor tarafından bunlardan yeniden kurulur.
 * Bu sayede kayıt küçük kalır (yüzlerce seçim birkaç KB), bozulmaya dayanıklıdır ve
 * kayıt kodu olarak başka cihaza taşınabilir.
 */
import { REAL_CLOCK, type ClockState } from '@/engine/clock';
import type { PlayerEvent } from '@/engine/runtime';

export const SAVE_VERSION = 1;

export type SaveData = {
  v: typeof SAVE_VERSION;
  storyId: string;
  storyVersion: string;
  startedAt: number;
  events: PlayerEvent[];
  /** Oyuncunun sohbeti en son gördüğü an (okunmamış rozeti) */
  lastReadAt: number;
  endingsSeen: string[];
  /** Kaçıncı oyun ("yeniden oyna" ile artar) */
  playthrough: number;
  /** Geliştirici modu saat ayarı; normal oyunda gerçek saat */
  clock: ClockState;
  updatedAt: number;
};

export function newSave(storyId: string, storyVersion: string, now: number, prev?: SaveData): SaveData {
  return {
    v: SAVE_VERSION,
    storyId,
    storyVersion,
    startedAt: now,
    events: [],
    lastReadAt: now,
    endingsSeen: prev?.endingsSeen ?? [],
    playthrough: (prev?.playthrough ?? 0) + 1,
    clock: prev?.clock ?? REAL_CLOCK,
    updatedAt: now,
  };
}

const isNum = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const isStr = (x: unknown): x is string => typeof x === 'string';

function parseEvent(x: unknown): PlayerEvent | null {
  if (!x || typeof x !== 'object') return null;
  const e = x as Record<string, unknown>;
  if (e.type === 'choice' && isStr(e.node) && isStr(e.choice) && isNum(e.at)) {
    return { type: 'choice', node: e.node, choice: e.choice, at: e.at };
  }
  if (e.type === 'jump' && isStr(e.node) && isNum(e.at)) return { type: 'jump', node: e.node, at: e.at };
  return null;
}

function parseClock(x: unknown): ClockState {
  if (!x || typeof x !== 'object') return REAL_CLOCK;
  const c = x as Record<string, unknown>;
  if (isNum(c.speed) && c.speed > 0 && isNum(c.anchorReal) && isNum(c.anchorVirtual)) {
    return { speed: c.speed, anchorReal: c.anchorReal, anchorVirtual: c.anchorVirtual, instant: c.instant === true };
  }
  return REAL_CLOCK;
}

/** Depodan okunan metni doğrular; bozuksa null döner */
export function parseSave(raw: string | null, storyId: string): SaveData | null {
  if (!raw) return null;
  try {
    const x = JSON.parse(raw) as Record<string, unknown>;
    if (x.v !== SAVE_VERSION || x.storyId !== storyId || !isNum(x.startedAt) || !Array.isArray(x.events)) return null;
    const events = x.events.map(parseEvent);
    if (events.some((e) => e === null)) return null;
    return {
      v: SAVE_VERSION,
      storyId,
      storyVersion: isStr(x.storyVersion) ? x.storyVersion : '?',
      startedAt: x.startedAt,
      events: events as PlayerEvent[],
      lastReadAt: isNum(x.lastReadAt) ? x.lastReadAt : x.startedAt,
      endingsSeen: Array.isArray(x.endingsSeen) ? x.endingsSeen.filter(isStr) : [],
      playthrough: isNum(x.playthrough) ? x.playthrough : 1,
      clock: parseClock(x.clock),
      updatedAt: isNum(x.updatedAt) ? x.updatedAt : x.startedAt,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Kayıt kodu: "FRK1-" + base64url(JSON)
// ---------------------------------------------------------------------------

const CODE_PREFIX = 'FRK1-';

type CompactSave = {
  s: string;
  t: number;
  /** [düğüm, seçim, zaman] ya da [düğüm, zaman] (atlama) */
  e: ([string, string, number] | [string, number])[];
  r: number;
  n: string[];
  p: number;
  c?: ClockState;
};

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(code: string): string {
  const b64 = code.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(bin, (ch) => ch.charCodeAt(0)));
}

export function encodeSaveCode(save: SaveData): string {
  const compact: CompactSave = {
    s: save.storyId,
    t: save.startedAt,
    e: save.events.map((ev) => (ev.type === 'choice' ? [ev.node, ev.choice, ev.at] : [ev.node, ev.at])),
    r: save.lastReadAt,
    n: save.endingsSeen,
    p: save.playthrough,
  };
  if (save.clock.speed !== 1 || save.clock.anchorReal !== save.clock.anchorVirtual) compact.c = save.clock;
  return CODE_PREFIX + toBase64Url(JSON.stringify(compact));
}

export function decodeSaveCode(code: string, storyVersion: string): SaveData | { error: string } {
  const trimmed = code.replace(/\s+/g, '');
  if (!trimmed.startsWith(CODE_PREFIX)) return { error: 'Bu bir Frekans kayıt kodu değil.' };
  try {
    const c = JSON.parse(fromBase64Url(trimmed.slice(CODE_PREFIX.length))) as CompactSave;
    if (!isStr(c.s) || !isNum(c.t) || !Array.isArray(c.e)) return { error: 'Kayıt kodu eksik ya da bozuk.' };
    // Zaman damgaları makul olmalı: 2025'ten sonra, (geliştirici saati dahil) şimdiden en fazla 2 gün ileride
    const clock = parseClock(c.c);
    const latest = Math.max(Date.now(), clock.anchorVirtual + (Date.now() - clock.anchorReal) * clock.speed) + 2 * 86_400_000;
    const earliest = Date.UTC(2025, 0, 1);
    if (c.t < earliest || c.t > latest) return { error: 'Kayıt kodu eksik ya da bozuk.' };
    let prev = c.t;
    const events: PlayerEvent[] = [];
    for (const e of c.e) {
      if (e.length === 3 && isStr(e[0]) && isStr(e[1]) && isNum(e[2])) {
        events.push({ type: 'choice', node: e[0], choice: e[1], at: e[2] });
      } else if (e.length === 2 && isStr(e[0]) && isNum(e[1])) {
        events.push({ type: 'jump', node: e[0], at: e[1] });
      } else return { error: 'Kayıt kodu bozuk.' };
      const at = events[events.length - 1]!.at;
      if (at < prev || at > latest) return { error: 'Kayıt kodu bozuk.' };
      prev = at;
    }
    return {
      v: SAVE_VERSION,
      storyId: c.s,
      storyVersion,
      startedAt: c.t,
      events,
      lastReadAt: isNum(c.r) ? c.r : c.t,
      endingsSeen: Array.isArray(c.n) ? c.n.filter(isStr) : [],
      playthrough: isNum(c.p) ? c.p : 1,
      clock: parseClock(c.c),
      updatedAt: Date.now(),
    };
  } catch {
    return { error: 'Kayıt kodu okunamadı. Tamamını kopyaladığından emin ol.' };
  }
}

/**
 * HİKAYE MOTORU — deterministik, zaman damgası tabanlı.
 *
 * Bir düğüme girildiğinde tüm adımları hemen "planlanır": her mesajın yazmaya
 * başlama (`typingFrom`) ve sohbete düşme (`at`, yani availableAt) zamanı hesaplanır,
 * etkiler sırayla uygulanır, seçimsiz düğümlerden otomatik geçilir. Plan, oyuncunun
 * cevabını bekleyen bir seçim noktasında (veya sonda) durur.
 *
 * Ekranda ne görüneceği ise `viewAt(now)` ile bulunur: `at <= now` olan mesajlar.
 * Uygulama kapalıyken geçen süre böylece kendiliğinden işlenir.
 *
 * Aynı hikaye + aynı başlangıç anı + aynı (seçim, zaman) dizisi her zaman aynı
 * sohbeti üretir; kayıt yalnızca bu diziyi saklar (bkz. replay).
 */
import type { ChatMessage, ChoiceOption, Presence } from '@/chat/types';
import { typingDurationMs } from '@/chat/typing';

import { inClockWindow, nextOccurrence } from './calendar';
import { MINUTE, SECOND, toMs } from './duration';
import { applyEffects, cloneVars, evaluate, initialVars, type Vars } from './state';
import type { EndingDef, MessageSpec, Story, StoryNode } from './types';

export const TIMING = {
  /** Oyun başladıktan sonra ilk mesajın yazılmaya başlaması */
  START_DELAY: 2 * SECOND,
  /** Ardışık mesajlar arası varsayılan bekleme (±%25 doğal sapma) */
  MESSAGE_GAP: 900,
  SYSTEM_GAP: 400,
  /** "telefonu kapatıyorum" mesajından sonra çevrimdışı olana kadar */
  AWAY_DELAY: 1500,
  /** Çevrimdışı olduktan sonra sistem notunun düşmesi */
  NOTICE_AFTER: 1200,
  /** Karakter son hareketinden sonra bu kadar süre "çevrimiçi" görünür */
  ONLINE_LINGER: 2 * MINUTE,
  DELIVER_DELAY: 600,
  /** Karakter çevrimiçiyken oyuncunun mesajını okuması */
  READ_DELAY_ONLINE: 1500,
  /** Karakter son görülme durumundayken (telefona bakmıyorken) okuması */
  READ_DELAY_IDLE: 7 * SECOND,
  /** Okuduktan sonra cevaba başlamadan önce */
  REPLY_AFTER_READ: 600,
  PHOTO_TYPING: 2400,
  LOCATION_TYPING: 1800,
  /** Bir planlamada en fazla bu kadar düğümden otomatik geçilir (sonsuz döngü koruması) */
  MAX_CHAIN: 300,
} as const;

/** En fazla bu kadar dürtme gönderilir */
export const MAX_NUDGES = 2;

export type TimedMessage = ChatMessage & {
  nodeId: string;
  /** Karakter mesajı: "yazıyor..." başlangıcı */
  typingFrom?: number;
  typingKind?: 'typing' | 'recording';
  /** Oyuncu mesajı: iletildi / okundu anları */
  deliveredAt?: number;
  readAt?: number;
};

export type Away = {
  from: number;
  to: number;
  nodeId: string;
  askNotifications?: boolean;
};

export type Nudge = { id: string; at: number; typingFrom: number; text: string };

export type Pending =
  | { kind: 'choice'; nodeId: string; at: number; nudges: Nudge[] }
  | { kind: 'ending'; nodeId: string; at: number; ending: string }
  | { kind: 'draft'; nodeId: string; at: number }
  | { kind: 'error'; nodeId: string; at: number; reason: string };

export type PlayerEvent =
  | { type: 'choice'; node: string; choice: string; at: number }
  /** Geliştirici modu: düğüme atla */
  | { type: 'jump'; node: string; at: number };

export type RunState = {
  storyId: string;
  startedAt: number;
  vars: Vars;
  messages: TimedMessage[];
  aways: Away[];
  /** Karakterin telefona baktığı anlar; "çevrimiçi" / "son görülme" bunlardan türetilir */
  activity: number[];
  pending: Pending;
  /** Düğüm girişi sayacı; mesaj kimlikleri bundan türetilir (deterministik) */
  seq: number;
  events: PlayerEvent[];
  /** Girilen düğümler (geliştirici paneli için) */
  trail: { nodeId: string; at: number }[];
};

export class EngineError extends Error {}

// ---------------------------------------------------------------------------
// Yardımcılar
// ---------------------------------------------------------------------------

/** Kimlikten türetilen, her seferinde aynı çıkan ±spread sapma */
export function jitter(key: string, ms: number, spread = 0.25): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  const r = ((h >>> 0) % 10_000) / 10_000; // 0..1
  return Math.round(ms * (1 + (r * 2 - 1) * spread));
}

function defaultTyping(content: MessageSpec, key: string): { ms: number; kind: 'typing' | 'recording' } {
  switch (content.kind) {
    case 'text':
      return { ms: jitter(key, typingDurationMs(content.text), 0.15), kind: 'typing' };
    case 'voice':
      return { ms: Math.min(15_000, Math.max(2000, content.durationSec * 700 + 800)), kind: 'recording' };
    case 'photo':
      return { ms: TIMING.PHOTO_TYPING, kind: 'typing' };
    case 'location':
      return { ms: TIMING.LOCATION_TYPING, kind: 'typing' };
    case 'deleted':
      return { ms: jitter(key, 2500, 0.2), kind: 'typing' };
  }
}

function getNode(story: Story, id: string): StoryNode | undefined {
  return story.nodes[id];
}

export function cloneRun(run: RunState): RunState {
  return {
    ...run,
    vars: cloneVars(run.vars),
    messages: run.messages.slice(),
    aways: run.aways.slice(),
    activity: run.activity.slice(),
    events: run.events.slice(),
    trail: run.trail.slice(),
    pending: run.pending.kind === 'choice' ? { ...run.pending, nudges: run.pending.nudges.slice() } : { ...run.pending },
  };
}

// ---------------------------------------------------------------------------
// Planlama
// ---------------------------------------------------------------------------

export type ScheduleOptions = {
  /** false: yalnızca bu düğümü planla, otomatik geçişleri takip etme (validasyon tahmini için) */
  follow?: boolean;
};

/**
 * `nodeId` düğümüne `t` anında girer ve planlamayı bir seçim, son, taslak veya hataya
 * kadar sürdürür. `run` yerinde değiştirilir.
 */
export function scheduleFrom(story: Story, run: RunState, nodeId: string, t: number, opts: ScheduleOptions = {}): void {
  const follow = opts.follow ?? true;
  let cursor = t;
  let currentId = nodeId;

  for (let guard = 0; ; guard++) {
    if (guard > TIMING.MAX_CHAIN) {
      run.pending = { kind: 'error', nodeId: currentId, at: cursor, reason: 'Sonsuz otomatik geçiş döngüsü' };
      return;
    }
    const node = getNode(story, currentId);
    if (!node) {
      run.pending = { kind: 'error', nodeId: currentId, at: cursor, reason: `Düğüm bulunamadı: ${currentId}` };
      return;
    }

    const entry = ++run.seq;
    run.vars.visited[node.id] = (run.vars.visited[node.id] ?? 0) + 1;
    run.trail.push({ nodeId: node.id, at: cursor });
    applyEffects(run.vars, node.onEnter, story.defs);

    cursor = planSteps(story, run, node, entry, cursor);

    if (node.ending) {
      run.pending = { kind: 'ending', nodeId: node.id, at: cursor, ending: node.ending };
      return;
    }
    if (node.draft !== undefined) {
      run.pending = { kind: 'draft', nodeId: node.id, at: cursor };
      return;
    }
    if (node.choices && node.choices.length > 0) {
      run.pending = { kind: 'choice', nodeId: node.id, at: cursor, nudges: planNudges(story, node, entry, cursor) };
      return;
    }
    const target = resolveNext(node, run.vars, cursor);
    if (!target) {
      run.pending = { kind: 'error', nodeId: node.id, at: cursor, reason: `Çıkışı olmayan düğüm: ${node.id}` };
      return;
    }
    if (!follow) {
      run.pending = { kind: 'draft', nodeId: target, at: cursor };
      return;
    }
    currentId = target;
  }
}

function resolveNext(node: StoryNode, vars: Vars, at: number): string | undefined {
  if (!node.next) return undefined;
  if (typeof node.next === 'string') return node.next;
  return node.next.find((b) => evaluate(b.if, vars, at))?.to;
}

/** Düğümün adımlarını zaman çizelgesine yerleştirir; son imleç zamanını döner */
function planSteps(story: Story, run: RunState, node: StoryNode, entry: number, start: number): number {
  let cursor = start;
  node.steps.forEach((step, i) => {
    if (!evaluate(step.if, run.vars, cursor)) return;
    const id = `${entry}.${i}`;
    switch (step.kind) {
      case 'message': {
        const delay = step.delay !== undefined ? toMs(step.delay) : jitter(id, TIMING.MESSAGE_GAP);
        const auto = defaultTyping(step.content, id);
        const typing = step.typing !== undefined ? toMs(step.typing) : auto.ms;
        const typingFrom = cursor + delay;
        const at = typingFrom + typing;
        run.messages.push({
          id,
          nodeId: node.id,
          sender: 'character',
          at,
          content: step.content,
          typingFrom,
          typingKind: auto.kind,
        });
        run.activity.push(typingFrom, at);
        cursor = at;
        break;
      }
      case 'system': {
        const at = cursor + (step.delay !== undefined ? toMs(step.delay) : TIMING.SYSTEM_GAP);
        run.messages.push({
          id,
          nodeId: node.id,
          sender: 'system',
          at,
          content: { kind: 'system', text: step.text, tone: step.tone },
        });
        cursor = at;
        break;
      }
      case 'away': {
        const from = cursor + (step.delay !== undefined ? toMs(step.delay) : TIMING.AWAY_DELAY);
        let to = from;
        if (step.for !== undefined) to = Math.max(to, from + toMs(step.for));
        if (step.until !== undefined) {
          const min = step.minFor !== undefined ? toMs(step.minFor) : 0;
          // `min` sağlanana kadar bir sonraki uygun saate kay
          to = Math.max(to, nextOccurrence(from + Math.max(0, min - 1), step.until));
        }
        run.aways.push({ from, to, nodeId: node.id, askNotifications: step.askNotifications });
        if (step.notice) {
          const noticeAt = Math.min(to, from + TIMING.NOTICE_AFTER);
          run.messages.push({
            id,
            nodeId: node.id,
            sender: 'system',
            at: noticeAt,
            content: { kind: 'system', text: step.notice, tone: 'warning' },
          });
        }
        // Döndüğünde telefona bakar: çevrimiçi görünür
        run.activity.push(to);
        cursor = to;
        break;
      }
      case 'effects':
        applyEffects(run.vars, step.effects, story.defs);
        break;
      case 'pause':
        cursor += toMs(step.for);
        run.activity.push(cursor);
        break;
    }
  });
  return cursor;
}

/** Seçimler göründükten sonra cevap gelmezse en fazla 2 dürtme; sessiz saatlerde gönderilmez */
function planNudges(story: Story, node: StoryNode, entry: number, choicesAt: number): Nudge[] {
  if (node.nudges === false) return [];
  const texts = node.nudges ?? story.nudges;
  const nudges: Nudge[] = [];
  const count = Math.min(MAX_NUDGES, texts.length, story.nudgeAfter.length);
  for (let k = 0; k < count; k++) {
    const at = choicesAt + toMs(story.nudgeAfter[k]!);
    if (inClockWindow(at, story.quietHours.from, story.quietHours.to)) continue;
    const text = texts[k]!;
    const typingFrom = Math.max(choicesAt + 1, at - typingDurationMs(text));
    nudges.push({ id: `${entry}.n${k}`, at, typingFrom, text });
  }
  return nudges;
}

// ---------------------------------------------------------------------------
// Oyuncu eylemleri
// ---------------------------------------------------------------------------

export function startRun(story: Story, startedAt: number): RunState {
  const run: RunState = {
    storyId: story.id,
    startedAt,
    vars: initialVars(story.defs),
    messages: [],
    aways: [],
    activity: [],
    pending: { kind: 'error', nodeId: story.start, at: startedAt, reason: 'başlatılmadı' },
    seq: 0,
    events: [],
    trail: [],
  };
  scheduleFrom(story, run, story.start, startedAt + TIMING.START_DELAY);
  return run;
}

/** `at` anında görünen (veya görünecek) seçimler, kilit durumlarıyla */
export function resolveChoices(story: Story, run: RunState): ChoiceOption[] {
  const p = run.pending;
  if (p.kind !== 'choice') return [];
  const node = getNode(story, p.nodeId);
  if (!node?.choices) return [];
  return node.choices
    .filter((c) => evaluate(c.visibleIf, run.vars, p.at))
    .map((c) => {
      const locked = !evaluate(c.requires, run.vars, p.at);
      return { id: c.id, text: c.text, locked, lockedReason: locked ? c.lockedReason : undefined };
    });
}

/** Oyuncunun seçimi. `run` yerinde değiştirilir; geçersizse EngineError fırlatır. */
export function applyChoiceInPlace(story: Story, run: RunState, choiceId: string, t: number): void {
  const p = run.pending;
  if (p.kind !== 'choice') throw new EngineError('Şu an seçim beklenmiyor');
  if (t < p.at) throw new EngineError('Seçimler henüz görünmedi');
  const node = getNode(story, p.nodeId);
  const choice = node?.choices?.find((c) => c.id === choiceId);
  if (!node || !choice) throw new EngineError(`Seçim bulunamadı: ${p.nodeId}/${choiceId}`);
  const option = resolveChoices(story, run).find((c) => c.id === choiceId);
  if (!option) throw new EngineError('Bu seçim görünür değil');
  if (option.locked) throw new EngineError('Bu seçim kilitli');

  // Cevaptan önce düşmüş dürtmeler kalıcı mesaj olur
  for (const n of p.nudges) {
    if (n.at > t) continue;
    run.messages.push({
      id: n.id,
      nodeId: p.nodeId,
      sender: 'character',
      at: n.at,
      content: { kind: 'text', text: n.text },
      typingFrom: n.typingFrom,
      typingKind: 'typing',
    });
    run.activity.push(n.typingFrom, n.at);
  }

  const online = presenceAt(run, t).kind !== 'lastSeen';
  const key = `p${run.events.length + 1}`;
  const readAt = t + jitter(key, online ? TIMING.READ_DELAY_ONLINE : TIMING.READ_DELAY_IDLE, 0.2);
  run.messages.push({
    id: key,
    nodeId: p.nodeId,
    sender: 'player',
    at: t,
    content: { kind: 'text', text: choice.message ?? choice.text },
    deliveredAt: t + TIMING.DELIVER_DELAY,
    readAt,
  });
  run.activity.push(readAt);
  applyEffects(run.vars, choice.effects, story.defs);
  run.events.push({ type: 'choice', node: p.nodeId, choice: choiceId, at: t });
  scheduleFrom(story, run, choice.to, readAt + TIMING.REPLY_AFTER_READ);
}

export function applyChoice(story: Story, run: RunState, choiceId: string, t: number): RunState {
  const next = cloneRun(run);
  applyChoiceInPlace(story, next, choiceId, t);
  return next;
}

/**
 * Geliştirici modu: herhangi bir düğüme atla. `t` sonrasına planlanmış her şey silinir,
 * durum (bayraklar vb.) korunur.
 */
export function jumpInPlace(story: Story, run: RunState, nodeId: string, t: number): void {
  if (!getNode(story, nodeId)) throw new EngineError(`Düğüm bulunamadı: ${nodeId}`);
  run.messages = run.messages.filter((m) => m.at <= t);
  run.aways = run.aways.filter((a) => a.from <= t).map((a) => (a.to > t ? { ...a, to: t } : a));
  run.activity = run.activity.filter((x) => x <= t);
  run.activity.push(t);
  run.events.push({ type: 'jump', node: nodeId, at: t });
  scheduleFrom(story, run, nodeId, t);
}

export type ReplayResult = {
  run: RunState;
  /** Başarıyla uygulanan olay sayısı; hikaye değiştiyse daha az olabilir */
  applied: number;
  error?: string;
};

/** Kayıttaki olay dizisinden sohbeti baştan kurar */
export function replay(story: Story, startedAt: number, events: readonly PlayerEvent[]): ReplayResult {
  const run = startRun(story, startedAt);
  let applied = 0;
  for (const ev of events) {
    try {
      if (ev.type === 'choice') {
        if (run.pending.kind !== 'choice' || run.pending.nodeId !== ev.node) {
          throw new EngineError(`Kayıt hikayeyle uyuşmuyor: beklenen ${ev.node}, bulunan ${run.pending.nodeId}`);
        }
        applyChoiceInPlace(story, run, ev.choice, ev.at);
      } else {
        jumpInPlace(story, run, ev.node, ev.at);
      }
      applied++;
    } catch (e) {
      return { run, applied, error: e instanceof Error ? e.message : String(e) };
    }
  }
  return { run, applied };
}

// ---------------------------------------------------------------------------
// Görünüm: "şu an" ekranda ne var?
// ---------------------------------------------------------------------------

function lastActivityAt(run: RunState, now: number, nudges: readonly Nudge[]): number | undefined {
  let last: number | undefined;
  for (const a of run.activity) if (a <= now && (last === undefined || a > last)) last = a;
  for (const n of nudges) {
    if (n.typingFrom <= now && (last === undefined || n.typingFrom > last)) last = n.typingFrom;
    if (n.at <= now && (last === undefined || n.at > last)) last = n.at;
  }
  return last;
}

function activeAway(run: RunState, now: number): Away | undefined {
  return run.aways.find((a) => a.from <= now && now < a.to);
}

function pendingNudges(run: RunState): Nudge[] {
  return run.pending.kind === 'choice' ? run.pending.nudges : [];
}

/** Başlıktaki durum satırı */
export function presenceAt(run: RunState, now: number): Presence {
  const away = activeAway(run, now);
  if (away) return { kind: 'lastSeen', at: away.from };
  const typingMsg = run.messages.find((m) => m.typingFrom !== undefined && m.typingFrom <= now && now < m.at);
  if (typingMsg) return { kind: typingMsg.typingKind === 'recording' ? 'recording' : 'typing' };
  const nudges = pendingNudges(run);
  if (nudges.some((n) => n.typingFrom <= now && now < n.at)) return { kind: 'typing' };
  const last = lastActivityAt(run, now, nudges);
  if (last === undefined) return { kind: 'unknown' };
  if (now - last < TIMING.ONLINE_LINGER) return { kind: 'online' };
  return { kind: 'lastSeen', at: last + TIMING.ONLINE_LINGER };
}

export type GameView = {
  now: number;
  messages: ChatMessage[];
  presence: Presence;
  choices: ChoiceOption[] | null;
  ending: (EndingDef & { id: string }) | null;
  /** Yazılmamış bir düğüme gelindi */
  draft: boolean;
  error: string | null;
  /** Aktif çevrimdışı dönemi bildirim izni istenmesini işaretliyorsa */
  askNotifications: boolean;
  /** Görünümün değişeceği bir sonraki an (zamanlayıcı için); yoksa null */
  nextChangeAt: number | null;
  currentNode: string;
};

function playerStatus(m: TimedMessage, now: number): ChatMessage['status'] {
  if (m.readAt !== undefined && now >= m.readAt) return 'read';
  if (m.deliveredAt !== undefined && now >= m.deliveredAt) return 'delivered';
  return 'sent';
}

export function viewAt(story: Story, run: RunState, now: number): GameView {
  const messages: ChatMessage[] = [];
  let next = Infinity;
  const consider = (t: number | undefined) => {
    if (t !== undefined && t > now && t < next) next = t;
  };

  for (const m of run.messages) {
    consider(m.typingFrom);
    consider(m.at);
    if (m.at > now) continue;
    if (m.sender === 'player') {
      consider(m.deliveredAt);
      consider(m.readAt);
      messages.push({ id: m.id, sender: m.sender, at: m.at, content: m.content, status: playerStatus(m, now) });
    } else {
      messages.push({ id: m.id, sender: m.sender, at: m.at, content: m.content });
    }
  }

  const p = run.pending;
  const nudges = pendingNudges(run);
  for (const n of nudges) {
    consider(n.typingFrom);
    consider(n.at);
    if (n.at <= now) messages.push({ id: n.id, sender: 'character', at: n.at, content: { kind: 'text', text: n.text } });
  }
  for (const a of run.aways) {
    consider(a.from);
    consider(a.to);
  }
  const last = lastActivityAt(run, now, nudges);
  if (last !== undefined) consider(last + TIMING.ONLINE_LINGER);
  consider(p.at);

  const reached = now >= p.at;
  const away = activeAway(run, now);
  const endingDef = p.kind === 'ending' ? story.endings[p.ending] : undefined;

  return {
    now,
    messages,
    presence: presenceAt(run, now),
    choices: reached && p.kind === 'choice' ? resolveChoices(story, run) : null,
    ending: reached && p.kind === 'ending' && endingDef ? { ...endingDef, id: p.ending } : null,
    draft: reached && p.kind === 'draft',
    error: reached && p.kind === 'error' ? p.reason : null,
    askNotifications: Boolean(away?.askNotifications),
    nextChangeAt: Number.isFinite(next) ? next : null,
    currentNode: p.nodeId,
  };
}

/**
 * Şu andan sonra karakterin "geri döndüğü" anlar: en az `minGapMs` sessizlikten sonra
 * gelen ilk mesaj ve dürtmeler. Faz 5'te push bildirimi planlamak için kullanılır.
 */
export function upcomingReturns(
  run: RunState,
  now: number,
  minGapMs = 60 * SECOND,
): { at: number; text: string; id: string }[] {
  const out: { at: number; text: string; id: string }[] = [];
  let prevAt = now;
  const preview = (m: TimedMessage): string => {
    const c = m.content;
    switch (c.kind) {
      case 'text':
        return c.text;
      case 'voice':
        return '🎤 Sesli mesaj';
      case 'photo':
        return c.caption ? `📷 ${c.caption}` : '📷 Fotoğraf';
      case 'location':
        return '📍 Konum';
      case 'deleted':
        return 'Bu mesaj silindi';
      case 'system':
        return c.text;
    }
  };
  for (const m of run.messages) {
    if (m.sender !== 'character' || m.at <= now) {
      if (m.at > prevAt) prevAt = m.at;
      continue;
    }
    if (m.at - prevAt >= minGapMs) out.push({ at: m.at, text: preview(m), id: m.id });
    prevAt = m.at;
  }
  for (const n of pendingNudges(run)) if (n.at > now) out.push({ at: n.at, text: n.text, id: n.id });
  return out;
}

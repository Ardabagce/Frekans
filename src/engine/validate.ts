/**
 * Hikaye doğrulama ve oynama süresi tahmini. `npm run validate-story` bunu kullanır;
 * testlerden de çağrılabilir (React'e bağımlı değil).
 */
import { ILLUSTRATION_IDS } from '@/ui/illustrations/ids';

import { isValidClock } from './calendar';
import { startOfLocalDay } from '@/lib/time';
import { DAY, formatSpan, isValidDuration } from './duration';
import { scheduleFrom, TIMING, type RunState } from './runtime';
import { initialVars } from './state';
import type { Condition, Effect, Story, StoryNode } from './types';

export type Issue = { level: 'error' | 'warning' | 'info'; node?: string; message: string };

type Refs = { flags: Set<string>; injuries: Set<string>; items: Set<string>; stats: Set<string> };

function walkCondition(c: Condition | undefined, visit: (c: Condition) => void): void {
  if (!c) return;
  visit(c);
  if ('not' in c) walkCondition(c.not, visit);
  if ('all' in c) c.all.forEach((x) => walkCondition(x, visit));
  if ('any' in c) c.any.forEach((x) => walkCondition(x, visit));
}

/** Düğümden çıkan tüm hedefler */
export function exitsOf(node: StoryNode): string[] {
  const out: string[] = [];
  node.choices?.forEach((c) => out.push(c.to));
  if (typeof node.next === 'string') out.push(node.next);
  else node.next?.forEach((b) => out.push(b.to));
  return out;
}

export function validateStory(story: Story): Issue[] {
  const issues: Issue[] = [];
  const err = (message: string, node?: string) => issues.push({ level: 'error', node, message });
  const warn = (message: string, node?: string) => issues.push({ level: 'warning', node, message });
  const info = (message: string, node?: string) => issues.push({ level: 'info', node, message });
  const { defs } = story;
  const nodes = Object.values(story.nodes);

  if (!story.nodes[story.start]) err(`Başlangıç düğümü yok: ${story.start}`);

  const read: Refs = { flags: new Set(), injuries: new Set(), items: new Set(), stats: new Set() };
  const written: Refs = { flags: new Set(), injuries: new Set(), items: new Set(), stats: new Set() };
  const usedEndings = new Set<string>();

  const checkCondition = (c: Condition | undefined, where: string, nodeId: string) =>
    walkCondition(c, (x) => {
      if ('flag' in x) {
        read.flags.add(x.flag);
        if (!(x.flag in defs.flags)) err(`Tanımsız bayrak "${x.flag}" (${where})`, nodeId);
      } else if ('injury' in x) {
        read.injuries.add(x.injury);
        if (!(x.injury in defs.injuries)) err(`Tanımsız yara "${x.injury}" (${where})`, nodeId);
      } else if ('item' in x) {
        read.items.add(x.item);
        if (!(x.item in defs.items)) err(`Tanımsız eşya "${x.item}" (${where})`, nodeId);
      } else if ('stat' in x) {
        read.stats.add(x.stat);
        if (!(x.stat in defs.stats)) err(`Tanımsız değer "${x.stat}" (${where})`, nodeId);
      } else if ('visited' in x) {
        if (!story.nodes[x.visited]) err(`"visited" koşulu olmayan düğümü işaret ediyor: ${x.visited}`, nodeId);
      } else if ('time' in x) {
        if (!isValidClock(x.time.from) || !isValidClock(x.time.to)) err(`Geçersiz saat aralığı (${where})`, nodeId);
      }
    });

  const checkEffects = (list: readonly Effect[] | undefined, where: string, nodeId: string) =>
    list?.forEach((e) => {
      const ref = (kind: keyof Refs, id: string, label: string) => {
        written[kind].add(id);
        if (!(id in defs[kind])) err(`Tanımsız ${label} "${id}" (${where})`, nodeId);
      };
      if ('set' in e) ref('flags', e.set, 'bayrak');
      else if ('unset' in e) ref('flags', e.unset, 'bayrak');
      else if ('injure' in e) ref('injuries', e.injure, 'yara');
      else if ('heal' in e) ref('injuries', e.heal, 'yara');
      else if ('give' in e) ref('items', e.give, 'eşya');
      else if ('take' in e) ref('items', e.take, 'eşya');
      else if ('stat' in e) ref('stats', e.stat, 'değer');
    });

  for (const n of nodes) {
    checkEffects(n.onEnter, 'onEnter', n.id);
    if (n.day < 1 || n.day > 7) warn(`Gün değeri 1–7 dışında: ${n.day}`, n.id);

    n.steps.forEach((s, i) => {
      const where = `adım ${i + 1}`;
      checkCondition(s.if, where, n.id);
      if ('delay' in s && s.delay !== undefined && !isValidDuration(s.delay)) err(`Geçersiz gecikme (${where})`, n.id);
      if (s.kind === 'message') {
        if (s.typing !== undefined && !isValidDuration(s.typing)) err(`Geçersiz yazıyor süresi (${where})`, n.id);
        const c = s.content;
        if (c.kind === 'photo' && !(ILLUSTRATION_IDS as readonly string[]).includes(c.image)) {
          err(`Bilinmeyen illüstrasyon "${c.image}" (${where})`, n.id);
        }
        if (c.kind === 'text' && c.text.trim() === '') err(`Boş mesaj (${where})`, n.id);
      }
      if (s.kind === 'away') {
        if (s.for === undefined && s.until === undefined) err(`away adımında "for" ya da "until" gerekli (${where})`, n.id);
        if (s.for !== undefined && !isValidDuration(s.for)) err(`Geçersiz away süresi (${where})`, n.id);
        if (s.minFor !== undefined && !isValidDuration(s.minFor)) err(`Geçersiz minFor (${where})`, n.id);
        if (s.until !== undefined && !isValidClock(s.until)) err(`Geçersiz saat "${s.until}" (${where})`, n.id);
      }
      if (s.kind === 'pause' && !isValidDuration(s.for)) err(`Geçersiz pause süresi (${where})`, n.id);
      if (s.kind === 'effects') checkEffects(s.effects, where, n.id);
    });

    const hasExit = Boolean(n.choices?.length) || n.next !== undefined || n.ending !== undefined;
    if (!hasExit && n.draft === undefined) err('Çıkışı olmayan düğüm (seçim, next veya ending yok)', n.id);
    if (!hasExit && n.draft !== undefined) warn('Taslak düğümün çıkışı yok (iskelet bağlantısı eksik)', n.id);
    if (n.ending !== undefined) {
      usedEndings.add(n.ending);
      if (!story.endings[n.ending]) err(`Tanımsız son "${n.ending}"`, n.id);
      if (n.choices?.length || n.next) warn('Son düğümünde seçim/next var; yok sayılacak', n.id);
    }
    if (n.choices && n.next) warn('Hem seçim hem next var; next yok sayılır', n.id);

    if (n.choices) {
      if (n.choices.length > 4) err(`${n.choices.length} seçim var (en fazla 4)`, n.id);
      if (n.choices.length === 1) info('Tek seçenekli seçim noktası', n.id);
      const ids = new Set<string>();
      n.choices.forEach((c) => {
        if (ids.has(c.id)) err(`Tekrarlanan seçim kimliği "${c.id}"`, n.id);
        ids.add(c.id);
        checkCondition(c.requires, `seçim "${c.text}" requires`, n.id);
        checkCondition(c.visibleIf, `seçim "${c.text}" visibleIf`, n.id);
        checkEffects(c.effects, `seçim "${c.text}"`, n.id);
        if (c.requires && !c.lockedReason) warn(`Kilitlenebilen seçimin sebebi yok: "${c.text}"`, n.id);
        if (!c.requires && c.lockedReason) warn(`lockedReason var ama requires yok: "${c.text}"`, n.id);
        if (c.text.length > 90) warn(`Seçim metni çok uzun (${c.text.length} karakter): "${c.text.slice(0, 40)}…"`, n.id);
      });
    }
    if (Array.isArray(n.next)) {
      n.next.forEach((b, i) => checkCondition(b.if, `next dalı ${i + 1}`, n.id));
      const last = n.next[n.next.length - 1];
      if (last?.if) warn('Koşullu next dallarının hiçbiri tutmazsa oyun takılır: son dala koşulsuz bir varsayılan ekle', n.id);
    }
    for (const t of exitsOf(n)) if (!story.nodes[t]) err(`Kırık bağlantı → "${t}"`, n.id);
    if (n.nudges && n.nudges.length > 2) warn('En fazla 2 dürtme kullanılır; fazlası yok sayılır', n.id);
  }

  // Ulaşılabilirlik
  const reach = reachable(story);
  for (const n of nodes) if (!reach.has(n.id)) warn('Ulaşılamayan düğüm', n.id);

  // Tanım kullanımı
  for (const kind of ['flags', 'injuries', 'items'] as const) {
    const label = { flags: 'bayrak', injuries: 'yara', items: 'eşya' }[kind];
    for (const id of Object.keys(defs[kind])) {
      if (!read[kind].has(id) && !written[kind].has(id)) info(`Hiç kullanılmayan ${label}: ${id}`);
      else if (read[kind].has(id) && !written[kind].has(id) && kind !== 'items') {
        warn(`Koşulda okunan ama hiçbir yerde verilmeyen ${label}: ${id}`);
      }
    }
  }
  for (const id of Object.keys(story.endings)) if (!usedEndings.has(id)) warn(`Hiçbir düğümde kullanılmayan son: ${id}`);
  for (const t of story.nudgeAfter) if (!isValidDuration(t)) err(`Geçersiz nudgeAfter: ${t}`);

  return issues;
}

export function reachable(story: Story): Set<string> {
  const seen = new Set<string>();
  const queue = [story.start];
  while (queue.length) {
    const id = queue.shift()!;
    if (seen.has(id)) continue;
    const n = story.nodes[id];
    if (!n) continue;
    seen.add(id);
    queue.push(...exitsOf(n));
  }
  return seen;
}

// ---------------------------------------------------------------------------
// Oynama süresi tahmini
// ---------------------------------------------------------------------------

export type PlaytimeEstimate = {
  startAt: number;
  startClock: string;
  /** Son kimliği → başlangıçtan en erken varış (ms) */
  endings: Record<string, number>;
  /** En erken ulaşılan taslak düğüm (henüz yazılmamış içerik) */
  firstDraft?: { node: string; ms: number };
  /** Gün → o güne ait düğümlere ilk varış (ms) */
  dayStarts: Record<number, number>;
  /** En kısa yoldaki ilk uzun aradan (≥1 saat) önceki kesintisiz oyun süresi */
  firstSessionMs?: number;
};

/**
 * Zamana bağlı en kısa yol (Dijkstra). Her düğüm, varış anında gerçek planlayıcıyla
 * yalnız başına planlanır; oyuncunun anında cevap verdiği varsayılır. Koşullu adımlar
 * başlangıç durumuna göre değerlendirilir (yaklaşık tahmin).
 */
export function estimatePlaytime(story: Story, startAt: number): PlaytimeEstimate {
  const best = new Map<string, number>();
  const queue: { id: string; t: number }[] = [{ id: story.start, t: startAt + TIMING.START_DELAY }];
  const endings: Record<string, number> = {};
  const dayStarts: Record<number, number> = {};
  let firstDraft: PlaytimeEstimate['firstDraft'];
  let firstSessionMs: number | undefined;

  while (queue.length) {
    queue.sort((a, b) => a.t - b.t);
    const { id, t } = queue.shift()!;
    if (best.has(id)) continue;
    best.set(id, t);
    const node = story.nodes[id];
    if (!node) continue;
    if (dayStarts[node.day] === undefined) dayStarts[node.day] = t - startAt;

    const run: RunState = {
      storyId: story.id,
      startedAt: startAt,
      vars: initialVars(story.defs),
      messages: [],
      aways: [],
      activity: [],
      pending: { kind: 'error', nodeId: id, at: t, reason: '' },
      seq: 0,
      events: [],
      trail: [],
    };
    scheduleFrom(story, run, id, t, { follow: false });
    const end = run.pending.at;

    if (firstSessionMs === undefined) {
      const longAway = run.aways.find((a) => a.to - a.from >= 60 * 60_000);
      if (longAway) firstSessionMs = longAway.from - startAt;
    }

    if (node.ending) {
      if (endings[node.ending] === undefined) endings[node.ending] = end - startAt;
      continue;
    }
    if (node.draft !== undefined) {
      if (!firstDraft) firstDraft = { node: id, ms: t - startAt };
      // Taslaklar süresiz sayılır; iskelet bağlantıları üzerinden devam et
    }
    const answer = node.choices?.length ? TIMING.READ_DELAY_ONLINE + TIMING.REPLY_AFTER_READ : 0;
    for (const target of exitsOf(node)) if (!best.has(target)) queue.push({ id: target, t: end + answer });
  }
  const d = new Date(startAt);
  const startClock = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return { startAt, startClock, endings, firstDraft, dayStarts, firstSessionMs };
}

export function describeEstimate(e: PlaytimeEstimate): string[] {
  const lines = [`Başlangıç saati ${e.startClock}:`];
  if (e.firstSessionMs !== undefined) lines.push(`  İlk oturum (ilk uzun aradan önce): ${formatSpan(e.firstSessionMs)}`);
  for (const [day, ms] of Object.entries(e.dayStarts)) lines.push(`  Gün ${day} en erken başlangıç: +${formatSpan(ms)}`);
  const ends = Object.entries(e.endings).sort((a, b) => a[1] - b[1]);
  for (const [id, ms] of ends) lines.push(`  Son "${id}": en erken +${formatSpan(ms)}`);
  if (ends.length) {
    const min = ends[0]![1];
    // "7 gün": oyun 7 ayrı takvim gününe yayılmalı (1. gün başlangıç, 7. gün son)
    const calendarDays = Math.round((startOfLocalDay(e.startAt + min) - startOfLocalDay(e.startAt)) / DAY) + 1;
    lines.push(
      calendarDays >= 7
        ? `  ✓ En kısa yol ${calendarDays} takvim gününe yayılıyor (${formatSpan(min)})`
        : `  ⚠ En kısa yol yalnızca ${calendarDays} takvim günü (${formatSpan(min)}); en az 7 olmalı${e.firstDraft ? ' — taslak düğümler süresiz sayıldı' : ''}`,
    );
  }
  if (e.firstDraft) lines.push(`  Yazılmamış ilk düğüm: ${e.firstDraft.node} (+${formatSpan(e.firstDraft.ms)})`);
  return lines;
}

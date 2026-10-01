/**
 * HİKAYE YAZIM KİTİ
 *
 * Hikaye dosyaları düğümleri bu yardımcılarla yazar. `createStoryKit(defs)` bayrak,
 * yara, eşya ve değer adlarını tiplere çevirir: tanımda olmayan bir adı kullanmak
 * derleme hatası verir (ayrıca `npm run validate-story` de yakalar).
 *
 * Örnek:
 *   node('g1_soba', {
 *     day: 1,
 *     steps: [say('sobayı buldum'), say('elim hala zonkluyor', { if: is.injury('yanik_sag_el') })],
 *     choices: [
 *       choice('Çırayla başla', 'g1_soba_iyi', { effects: [fx.stat('moral', +5)] }),
 *       choice('İpi tut', 'g1_ip', { requires: is.not(is.injury('yanik_sag_el')), lockedReason: 'Elin yanık, ipi tutamazsın.' }),
 *     ],
 *   })
 */
import type { IllustrationId } from '@/ui/illustrations/ids';

import type {
  AwayStep,
  Branch,
  Choice,
  ClockTime,
  Duration,
  EffectsStep,
  EndingDef,
  MessageStep,
  PauseStep,
  Story,
  StoryDefs,
  StoryNode,
  SystemStep,
  TimeOfDay,
} from './types';

type Ids<D extends StoryDefs> = {
  F: Extract<keyof D['flags'], string>;
  I: Extract<keyof D['injuries'], string>;
  It: Extract<keyof D['items'], string>;
  S: Extract<keyof D['stats'], string>;
};

export type KitCondition<F extends string, I extends string, It extends string, S extends string> =
  | { flag: F }
  | { injury: I }
  | { item: It }
  | { stat: S; gte?: number; lte?: number; gt?: number; lt?: number }
  | { visited: string }
  | { timeOfDay: TimeOfDay | TimeOfDay[] }
  | { time: { from: ClockTime; to: ClockTime } }
  | { not: KitCondition<F, I, It, S> }
  | { all: KitCondition<F, I, It, S>[] }
  | { any: KitCondition<F, I, It, S>[] };

export type KitEffect<F extends string, I extends string, It extends string, S extends string> =
  | { set: F }
  | { unset: F }
  | { injure: I }
  | { heal: I }
  | { give: It }
  | { take: It }
  | { stat: S; add?: number; to?: number };

export function createStoryKit<const D extends StoryDefs>(defs: D) {
  type F = Ids<D>['F'];
  type I = Ids<D>['I'];
  type It = Ids<D>['It'];
  type S = Ids<D>['S'];
  type Cond = KitCondition<F, I, It, S>;
  type Eff = KitEffect<F, I, It, S>;
  type StepOpts = { delay?: Duration; typing?: Duration; if?: Cond };

  // ---- Mesaj adımları ----
  const say = (text: string, opts: StepOpts = {}): MessageStep => ({
    kind: 'message',
    content: { kind: 'text', text },
    ...opts,
  });
  const voice = (durationSec: number, transcript: string, opts: StepOpts = {}): MessageStep => ({
    kind: 'message',
    content: { kind: 'voice', durationSec, transcript },
    ...opts,
  });
  const photo = (image: IllustrationId, caption?: string, opts: StepOpts = {}): MessageStep => ({
    kind: 'message',
    content: { kind: 'photo', image, caption },
    ...opts,
  });
  const location = (label: string, lat: number, lng: number, opts: StepOpts = {}): MessageStep => ({
    kind: 'message',
    content: { kind: 'location', label, lat, lng },
    ...opts,
  });
  const deleted = (opts: StepOpts = {}): MessageStep => ({ kind: 'message', content: { kind: 'deleted' }, ...opts });

  const system = (
    text: string,
    opts: { tone?: 'info' | 'warning'; delay?: Duration; if?: Cond } = {},
  ): SystemStep => ({ kind: 'system', text, ...opts });

  // ---- Zaman adımları ----
  type AwayOpts = Omit<AwayStep, 'kind' | 'if'> & { if?: Cond };
  /** Görev / telefonu kapatma: away({ for: '7m', notice: 'Deniz’in bağlantısı koptu' }) */
  const away = (opts: AwayOpts): AwayStep => ({ kind: 'away', ...opts });
  /** Uyku: bir sonraki yerel saate kadar (en az 2 saat; daha yakınsa ertesi güne kayar) */
  const sleepUntil = (until: ClockTime, opts: Omit<AwayOpts, 'until'> = {}): AwayStep => ({
    kind: 'away',
    until,
    minFor: '2h',
    ...opts,
  });
  const pause = (d: Duration, opts: { if?: Cond } = {}): PauseStep => ({ kind: 'pause', for: d, ...opts });
  const effects = (list: Eff[], opts: { if?: Cond } = {}): EffectsStep => ({ kind: 'effects', effects: list, ...opts });

  // ---- Koşullar ----
  const is = {
    flag: (f: F): Cond => ({ flag: f }),
    injury: (i: I): Cond => ({ injury: i }),
    item: (it: It): Cond => ({ item: it }),
    stat: (s: S, cmp: { gte?: number; lte?: number; gt?: number; lt?: number }): Cond => ({ stat: s, ...cmp }),
    visited: (nodeId: string): Cond => ({ visited: nodeId }),
    timeOfDay: (...t: TimeOfDay[]): Cond => ({ timeOfDay: t }),
    between: (from: ClockTime, to: ClockTime): Cond => ({ time: { from, to } }),
    not: (c: Cond): Cond => ({ not: c }),
    all: (...c: Cond[]): Cond => ({ all: c }),
    any: (...c: Cond[]): Cond => ({ any: c }),
  };

  // ---- Etkiler ----
  const fx = {
    set: (f: F): Eff => ({ set: f }),
    unset: (f: F): Eff => ({ unset: f }),
    injure: (i: I): Eff => ({ injure: i }),
    heal: (i: I): Eff => ({ heal: i }),
    give: (it: It): Eff => ({ give: it }),
    take: (it: It): Eff => ({ take: it }),
    stat: (s: S, add: number): Eff => ({ stat: s, add }),
    statTo: (s: S, to: number): Eff => ({ stat: s, to }),
  };

  // ---- Seçim ve düğüm ----
  type ChoiceOpts = Omit<Choice, 'text' | 'to' | 'id' | 'requires' | 'visibleIf' | 'effects'> & {
    id?: string;
    effects?: Eff[];
    requires?: Cond;
    visibleIf?: Cond;
  };
  type DraftChoice = Omit<Choice, 'id'> & { id?: string };
  const choice = (text: string, to: string, opts: ChoiceOpts = {}): DraftChoice => ({ text, to, ...opts });

  type NodeDef = Omit<StoryNode, 'id' | 'steps' | 'choices' | 'onEnter' | 'next'> & {
    steps?: StoryNode['steps'];
    choices?: DraftChoice[];
    onEnter?: Eff[];
    next?: string | { if?: Cond; to: string }[];
  };

  /**
   * Seçim kimliği verilmezse hedef düğümden türetilir (aynı hedefe giden ikinci seçim "-2" alır).
   * Kimlikler kayıtlarda saklanır: yayından sonra bir seçimin hedefini değiştirirken
   * eski kimliği `id` ile sabitle.
   */
  const node = (id: string, def: NodeDef): StoryNode => {
    const seen = new Map<string, number>();
    const choices = def.choices?.map((c): Choice => {
      let cid = c.id ?? c.to;
      const n = (seen.get(cid) ?? 0) + 1;
      seen.set(cid, n);
      if (n > 1) cid = `${cid}-${n}`;
      return { ...c, id: cid };
    });
    return { ...def, id, steps: def.steps ?? [], choices, next: def.next as string | Branch[] | undefined };
  };

  /** Henüz yazılmamış düğüm: başlık + özet; oyuncu gelirse "devamı yakında" görür */
  const draft = (
    id: string,
    day: number,
    title: string,
    summary: string,
    exits: { choices?: DraftChoice[]; next?: NodeDef['next']; ending?: string } = {},
  ): StoryNode => node(id, { day, title, draft: summary, ...exits });

  return { defs, say, voice, photo, location, deleted, system, away, sleepUntil, pause, effects, is, fx, choice, node, draft };
}

/** Düğüm dizisini hikayeye çevirir; tekrar eden kimlikte hata verir */
export function defineStory(
  story: Omit<Story, 'nodes'> & { nodes: StoryNode[]; endings: Record<string, EndingDef> },
): Story {
  const nodes: Record<string, StoryNode> = {};
  for (const n of story.nodes) {
    if (nodes[n.id]) throw new Error(`Tekrarlanan düğüm kimliği: ${n.id}`);
    nodes[n.id] = n;
  }
  return { ...story, nodes };
}

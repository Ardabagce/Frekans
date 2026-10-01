/**
 * Oyuncunun hikaye içindeki durumu (bayraklar, yaralar, envanter, sayısal değerler)
 * ve buna göre koşul değerlendirme / etki uygulama.
 */
import { inClockWindow, timeOfDay } from './calendar';
import type { Condition, Effect, StoryDefs } from './types';

export type Vars = {
  flags: Record<string, true>;
  injuries: Record<string, true>;
  items: Record<string, true>;
  stats: Record<string, number>;
  /** Düğüm id → kaç kez girildi */
  visited: Record<string, number>;
};

export function initialVars(defs: StoryDefs): Vars {
  const stats: Record<string, number> = {};
  for (const [id, def] of Object.entries(defs.stats)) stats[id] = def.initial;
  return { flags: {}, injuries: {}, items: {}, stats, visited: {} };
}

export function cloneVars(v: Vars): Vars {
  return {
    flags: { ...v.flags },
    injuries: { ...v.injuries },
    items: { ...v.items },
    stats: { ...v.stats },
    visited: { ...v.visited },
  };
}

/** Koşulu değerlendirir. `at`, saate bağlı koşullar için olayın zaman damgasıdır. */
export function evaluate(cond: Condition | undefined, vars: Vars, at: number): boolean {
  if (!cond) return true;
  if ('flag' in cond) return Boolean(vars.flags[cond.flag]);
  if ('injury' in cond) return Boolean(vars.injuries[cond.injury]);
  if ('item' in cond) return Boolean(vars.items[cond.item]);
  if ('visited' in cond) return (vars.visited[cond.visited] ?? 0) > 0;
  if ('stat' in cond) {
    const v = vars.stats[cond.stat] ?? 0;
    if (cond.gte !== undefined && !(v >= cond.gte)) return false;
    if (cond.lte !== undefined && !(v <= cond.lte)) return false;
    if (cond.gt !== undefined && !(v > cond.gt)) return false;
    if (cond.lt !== undefined && !(v < cond.lt)) return false;
    return true;
  }
  if ('timeOfDay' in cond) {
    const list = Array.isArray(cond.timeOfDay) ? cond.timeOfDay : [cond.timeOfDay];
    return list.includes(timeOfDay(at));
  }
  if ('time' in cond) return inClockWindow(at, cond.time.from, cond.time.to);
  if ('not' in cond) return !evaluate(cond.not, vars, at);
  if ('all' in cond) return cond.all.every((c) => evaluate(c, vars, at));
  if ('any' in cond) return cond.any.some((c) => evaluate(c, vars, at));
  return assertNever(cond);
}

/** Etkiyi yerinde uygular. Sayısal değerler tanımdaki min/max (varsayılan 0–100) içinde tutulur. */
export function applyEffect(vars: Vars, effect: Effect, defs: StoryDefs): void {
  if ('set' in effect) vars.flags[effect.set] = true;
  else if ('unset' in effect) delete vars.flags[effect.unset];
  else if ('injure' in effect) vars.injuries[effect.injure] = true;
  else if ('heal' in effect) delete vars.injuries[effect.heal];
  else if ('give' in effect) vars.items[effect.give] = true;
  else if ('take' in effect) delete vars.items[effect.take];
  else if ('stat' in effect) {
    const def = defs.stats[effect.stat];
    const min = def?.min ?? 0;
    const max = def?.max ?? 100;
    const current = vars.stats[effect.stat] ?? def?.initial ?? 0;
    const next = effect.to !== undefined ? effect.to : current + (effect.add ?? 0);
    vars.stats[effect.stat] = Math.min(max, Math.max(min, next));
  } else assertNever(effect);
}

export function applyEffects(vars: Vars, effects: readonly Effect[] | undefined, defs: StoryDefs): void {
  if (!effects) return;
  for (const e of effects) applyEffect(vars, e, defs);
}

function assertNever(x: never): never {
  throw new Error(`Bilinmeyen koşul/etki: ${JSON.stringify(x)}`);
}

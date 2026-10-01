/**
 * Kayıt güvenliği: ilerleme hiçbir durumda sessizce kaybolmamalı.
 */
import { describe, expect, it } from 'vitest';

import { GameStore } from '@/game/GameStore';
import { parseSave } from '@/game/save';
import type { KeyValueStorage } from '@/game/storage';
import { dagEvi } from '@stories/dag-evi';

class MemStorage implements KeyValueStorage {
  map = new Map<string, string>();
  readonly isPersistent = true;
  get(k: string) {
    return this.map.get(k) ?? null;
  }
  set(k: string, v: string) {
    this.map.set(k, v);
  }
  remove(k: string) {
    this.map.delete(k);
  }
}

const KEY = 'frekans:save:dag-evi';

/** Seçimler görünene kadar sanal saati ilerletip ilk açık seçeneği seçer */
function playChoices(store: GameStore, n: number) {
  for (let i = 0; i < n; i++) {
    const run = store.getRun();
    if (run.pending.kind !== 'choice') return;
    store.skipBy(Math.max(0, run.pending.at - store.now()) + 500);
    const open = store.getSnapshot().view.choices?.find((c) => !c.locked);
    if (!open) return;
    expect(store.choose(open.id)).toBe(true);
  }
}

const events = (s: MemStorage) => parseSave(s.get(KEY), 'dag-evi')?.events.length ?? -1;

describe('kayıt güvenliği', () => {
  it('her seçim anında kaydedilir; yeni bir oturum aynı yerden devam eder', () => {
    const s = new MemStorage();
    const a = new GameStore(dagEvi, s);
    playChoices(a, 5);
    expect(events(s)).toBe(5);
    const b = new GameStore(dagEvi, s);
    expect(b.getRun().events).toHaveLength(5);
    expect(b.getRun().pending).toEqual(a.getRun().pending);
  });

  it('geride kalmış bir sekme yeni ilerlemenin üzerine yazamaz', () => {
    const s = new MemStorage();
    const stale = new GameStore(dagEvi, s); // dinleyicisiz açılmış eski sekme
    const fresh = new GameStore(dagEvi, s);
    playChoices(fresh, 6);
    expect(events(s)).toBe(6);
    // Eski sekme öne geldi: abone olur, okundu işaretler, saat ilerletir
    const off = stale.subscribe(() => {});
    stale.markRead();
    stale.skipBy(1000);
    off();
    expect(events(s)).toBe(6);
    expect(stale.getRun().events).toHaveLength(6);
  });

  it('kod yüklemeden önceki ilerleme saklanır, görülen sonlar birleştirilir', () => {
    const s = new MemStorage();
    const a = new GameStore(dagEvi, s);
    playChoices(a, 3);
    const code = a.exportCode();
    playChoices(a, 4); // 7 adım
    const r = a.importCode(code);
    expect(r.ok).toBe(true);
    expect(a.getRun().events).toHaveLength(3);
    const before = parseSave(s.get(`${KEY}:ice-aktarma-oncesi`), 'dag-evi');
    expect(before?.events).toHaveLength(7);
  });

  it('bozuk ana kayıt silinmez: karantinaya alınır, yedekten devam edilir', () => {
    const s = new MemStorage();
    const a = new GameStore(dagEvi, s);
    playChoices(a, 4); // ana kayıt 4, yedek 3
    s.set(KEY, '{bozuk json');
    const b = new GameStore(dagEvi, s);
    expect(b.getRun().events.length).toBe(3);
    expect(s.get(`${KEY}:bozuk`)).toContain('{bozuk json');
    // Yedekten dönülen kayıt hemen ana kayda yazıldı
    expect(events(s)).toBe(3);
  });

  it('baştan başlatınca önceki oyun silinmeyen kopyalarda kalır', () => {
    const s = new MemStorage();
    const a = new GameStore(dagEvi, s);
    playChoices(a, 4);
    a.restart();
    expect(events(s)).toBe(0);
    const copies = JSON.parse(s.get(`${KEY}:kesik`) ?? '[]') as { raw: string }[];
    expect(copies.some((c) => parseSave(c.raw, 'dag-evi')?.events.length === 4)).toBe(true);
  });
});

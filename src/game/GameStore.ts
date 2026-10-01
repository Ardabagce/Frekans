/**
 * Bir hikayenin oyun deposu: kaydı yükler, motoru çalıştırır, zamanı ilerletir,
 * arayüze anlık görüntü (snapshot) verir. Arayüz `useGame(storyId)` ile bağlanır.
 */
import { advancedTo, realDelay, virtualNow, withSpeed, type ClockState } from '@/engine/clock';
import {
  applyChoiceInPlace,
  cloneRun,
  EngineError,
  jumpInPlace,
  replay,
  startRun,
  viewAt,
  type GameView,
  type RunState,
} from '@/engine/runtime';
import type { Vars } from '@/engine/state';
import type { Story } from '@/engine/types';

import { decodeSaveCode, encodeSaveCode, newSave, parseSave, type SaveData } from './save';
import { onExternalChange, type KeyValueStorage } from './storage';

export type GameSnapshot = {
  storyId: string;
  view: GameView;
  /** Okunmamış karakter mesajı sayısı (sohbet listesi rozeti) */
  unread: number;
  endingsSeen: string[];
  playthrough: number;
  clock: ClockState;
  dev: {
    vars: Vars;
    pendingKind: RunState['pending']['kind'];
    pendingAt: number;
    eventCount: number;
    trail: RunState['trail'];
    replayError: string | null;
  };
};

export type IncomingListener = (storyId: string, count: number) => void;

/** Zamanlayıcı en fazla bu kadar bekler (saat etiketi vb. tazelensin) */
const MAX_TIMER_MS = 30_000;
/** "Anında" modunda olaylar arası gerçek bekleme */
const INSTANT_STEP_MS = 350;

const saveKey = (id: string) => `frekans:save:${id}`;
const backupKey = (id: string) => `frekans:save:${id}:yedek`;

export class GameStore {
  private save: SaveData;
  private run: RunState;
  private snap: GameSnapshot;
  private listeners = new Set<() => void>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private replayError: string | null = null;
  private lastCharacterCount = -1;
  private unsubExternal: (() => void) | null = null;

  static incoming = new Set<IncomingListener>();

  constructor(
    readonly story: Story,
    private storage: KeyValueStorage,
  ) {
    const loaded = this.load();
    this.save = loaded.save;
    this.run = loaded.run;
    this.snap = this.computeSnapshot();
    this.lastCharacterCount = this.characterCount(this.snap.view);
  }

  // ------------------------------------------------------------------ yükleme

  private load(): { save: SaveData; run: RunState } {
    const id = this.story.id;
    const primary = parseSave(this.storage.get(saveKey(id)), id);
    const save = primary ?? parseSave(this.storage.get(backupKey(id)), id);
    if (!save) {
      const fresh = newSave(id, this.story.version, Date.now());
      this.write(fresh, false);
      return { save: fresh, run: startRun(this.story, fresh.startedAt) };
    }
    if (!primary) console.warn('[Frekans] Ana kayıt okunamadı, yedekten dönüldü');
    return this.rebuild(save);
  }

  /** Kayıttan sohbeti yeniden kurar; hikaye değiştiği için uygulanamayan olayları kırpar */
  private rebuild(save: SaveData): { save: SaveData; run: RunState } {
    const result = replay(this.story, save.startedAt, save.events);
    if (result.error) {
      this.replayError = result.error;
      console.warn(`[Frekans] Kayıt kısmen oynatılabildi (${result.applied}/${save.events.length}): ${result.error}`);
      // Orijinali yedekte tut, kırpılmış hâliyle devam et
      this.storage.set(backupKey(save.storyId), JSON.stringify(save));
      const trimmed = { ...save, events: save.events.slice(0, result.applied) };
      this.storage.set(saveKey(save.storyId), JSON.stringify(trimmed));
      return { save: trimmed, run: result.run };
    }
    return { save, run: result.run };
  }

  private write(save: SaveData, keepBackup = true) {
    const id = this.story.id;
    if (keepBackup) {
      const current = this.storage.get(saveKey(id));
      if (current) this.storage.set(backupKey(id), current);
    }
    this.storage.set(saveKey(id), JSON.stringify({ ...save, updatedAt: Date.now() }));
  }

  private persist() {
    this.save = { ...this.save, events: this.run.events.slice() };
    this.write(this.save);
  }

  // ------------------------------------------------------------------ abonelik

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    if (this.listeners.size === 1) this.activate();
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) this.deactivate();
    };
  };

  getSnapshot = (): GameSnapshot => this.snap;

  private activate() {
    this.unsubExternal = onExternalChange((key) => {
      if (key === saveKey(this.story.id)) this.reloadFromStorage();
    });
    this.refresh();
  }

  private deactivate() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.unsubExternal?.();
    this.unsubExternal = null;
  }

  /** Başka sekmede ilerleme olduysa onu al */
  private reloadFromStorage() {
    const s = parseSave(this.storage.get(saveKey(this.story.id)), this.story.id);
    if (!s || s.updatedAt <= this.save.updatedAt) return;
    const { save, run } = this.rebuild(s);
    this.save = save;
    this.run = run;
    this.lastCharacterCount = -1; // geri dönüşte ses çalma
    this.refresh();
  }

  // ------------------------------------------------------------------ zaman

  now(): number {
    return virtualNow(this.save.clock);
  }

  private characterCount(view: GameView): number {
    let n = 0;
    for (const m of view.messages) if (m.sender === 'character') n++;
    return n;
  }

  private computeSnapshot(): GameSnapshot {
    const view = viewAt(this.story, this.run, this.now());
    let unread = 0;
    for (const m of view.messages) if (m.sender === 'character' && m.at > this.save.lastReadAt) unread++;
    return {
      storyId: this.story.id,
      view,
      unread,
      endingsSeen: this.save.endingsSeen,
      playthrough: this.save.playthrough,
      clock: this.save.clock,
      dev: {
        vars: this.run.vars,
        pendingKind: this.run.pending.kind,
        pendingAt: this.run.pending.at,
        eventCount: this.run.events.length,
        trail: this.run.trail,
        replayError: this.replayError,
      },
    };
  }

  /** Görünümü yeniden hesaplar, dinleyicilere haber verir, bir sonraki değişim için zamanlayıcı kurar */
  refresh = () => {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.snap = this.computeSnapshot();
    const view = this.snap.view;

    // Yeni gelen karakter mesajları (açılıştaki toplu yükleme hariç)
    const count = this.characterCount(view);
    if (this.lastCharacterCount >= 0 && count > this.lastCharacterCount) {
      const added = count - this.lastCharacterCount;
      GameStore.incoming.forEach((l) => l(this.story.id, added));
    }
    this.lastCharacterCount = count;

    // Son düğüme ulaşıldıysa kaydet
    if (view.ending && !this.save.endingsSeen.includes(view.ending.id)) {
      this.save = { ...this.save, endingsSeen: [...this.save.endingsSeen, view.ending.id] };
      this.write(this.save);
    }

    this.listeners.forEach((l) => l());
    if (this.listeners.size === 0) return;

    const clock = this.save.clock;
    if (clock.instant && view.nextChangeAt !== null && !view.choices) {
      const target = view.nextChangeAt;
      this.timer = setTimeout(() => {
        this.save = { ...this.save, clock: advancedTo(this.save.clock, target) };
        this.write(this.save, false);
        this.refresh();
      }, INSTANT_STEP_MS);
      return;
    }
    const wait =
      view.nextChangeAt === null ? MAX_TIMER_MS : Math.min(MAX_TIMER_MS, realDelay(clock, view.nextChangeAt - view.now) + 15);
    this.timer = setTimeout(this.refresh, Math.max(16, wait));
  };

  // ------------------------------------------------------------------ oyuncu

  choose(choiceId: string): boolean {
    const next = cloneRun(this.run);
    try {
      applyChoiceInPlace(this.story, next, choiceId, this.now());
    } catch (e) {
      if (e instanceof EngineError) {
        console.warn('[Frekans]', e.message);
        return false;
      }
      throw e;
    }
    this.run = next;
    this.save = { ...this.save, lastReadAt: this.now() };
    this.persist();
    this.refresh();
    return true;
  }

  markRead() {
    const msgs = this.snap.view.messages;
    const last = msgs[msgs.length - 1];
    if (!last || last.at <= this.save.lastReadAt) return;
    this.save = { ...this.save, lastReadAt: last.at };
    this.write(this.save, false);
    this.snap = { ...this.snap, unread: 0 };
    this.listeners.forEach((l) => l());
  }

  /** Hikayeyi baştan başlat (görülen sonlar korunur) */
  restart() {
    this.write(this.save); // mevcut hâli yedeğe düşsün
    this.save = newSave(this.story.id, this.story.version, this.now(), this.save);
    this.run = startRun(this.story, this.save.startedAt);
    this.replayError = null;
    this.lastCharacterCount = 0;
    this.write(this.save, false);
    this.refresh();
  }

  exportCode(): string {
    return encodeSaveCode({ ...this.save, events: this.run.events.slice() });
  }

  /** Kayıt kodunu yükler; hata varsa açıklamasını döner */
  importCode(code: string): string | null {
    const decoded = decodeSaveCode(code, this.story.version);
    if ('error' in decoded) return decoded.error;
    if (decoded.storyId !== this.story.id) return 'Bu kod başka bir hikayeye ait.';
    const result = replay(this.story, decoded.startedAt, decoded.events);
    if (result.error && result.applied === 0 && decoded.events.length > 0) {
      return 'Kayıt bu hikaye sürümüyle uyuşmuyor.';
    }
    this.write(this.save); // mevcut ilerleme yedeğe
    const { save, run } = this.rebuild(decoded);
    this.save = save;
    this.run = run;
    this.lastCharacterCount = -1;
    this.write(this.save, false);
    this.refresh();
    return null;
  }

  // ------------------------------------------------------------------ geliştirici

  setSpeed(speed: number, instant = false) {
    this.save = { ...this.save, clock: { ...withSpeed(this.save.clock, speed), instant } };
    this.write(this.save, false);
    this.refresh();
  }

  /** Bir sonraki olaya (mesaj, dönüş, dürtme…) atla */
  skipToNext() {
    const next = this.snap.view.nextChangeAt;
    if (next === null) return;
    this.advanceTo(next);
  }

  skipBy(ms: number) {
    this.advanceTo(this.now() + ms);
  }

  private advanceTo(t: number) {
    this.save = { ...this.save, clock: advancedTo(this.save.clock, t) };
    this.write(this.save, false);
    this.refresh();
  }

  jumpTo(nodeId: string): string | null {
    const next = cloneRun(this.run);
    try {
      jumpInPlace(this.story, next, nodeId, this.now());
    } catch (e) {
      return e instanceof Error ? e.message : String(e);
    }
    this.run = next;
    this.persist();
    this.refresh();
    return null;
  }

  /** Her şeyi sil: kayıt, yedek, görülen sonlar, saat ayarı */
  hardReset() {
    this.storage.remove(saveKey(this.story.id));
    this.storage.remove(backupKey(this.story.id));
    this.save = newSave(this.story.id, this.story.version, Date.now());
    this.save = { ...this.save, playthrough: 1, endingsSeen: [] };
    this.run = startRun(this.story, this.save.startedAt);
    this.replayError = null;
    this.lastCharacterCount = 0;
    this.write(this.save, false);
    this.refresh();
  }
}

/**
 * Bir hikayenin oyun deposu: kaydı yükler, motoru çalıştırır, zamanı ilerletir,
 * arayüze anlık görüntü (snapshot) verir. Arayüz `useGame(storyId)` ile bağlanır.
 *
 * İLERLEME KAYBOLMAMA KURALLARI
 *  1. Her yazmadan önce depo okunur; başka sekme/oturum daha yeni bir kayıt yazdıysa
 *     önce o alınır, eski hâl asla yeninin üzerine yazılmaz.
 *  2. Bir kayıt kısmen oynatılabilirse (hikayeden seçim silindiyse) orijinali, hiç
 *     üzerine yazılmayan ayrı bir anahtarda saklanır.
 *  3. Okunamayan kayıt silinmez; karantina anahtarına kopyalanır.
 *  4. Kod ile yüklemeden önceki ilerleme ayrı bir anahtarda saklanır.
 */
import { advancedTo, isRealClock, realDelay, virtualNow, withSpeed, type ClockState } from '@/engine/clock';
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
/** Kayıt değiştiğinde (seçim, yeniden başlatma, kod yükleme, saat ayarı): sunucu yedeği ve push planı için */
export type ChangeListener = (store: GameStore, reason: ChangeReason) => void;
export type ChangeReason = 'load' | 'choice' | 'restart' | 'import' | 'clock' | 'jump' | 'reset' | 'sync';

export type ImportResult = { ok: boolean; message: string };

/** Zamanlayıcı en fazla bu kadar bekler (saat etiketi vb. tazelensin) */
const MAX_TIMER_MS = 30_000;
/** "Anında" modunda olaylar arası gerçek bekleme */
const INSTANT_STEP_MS = 350;
/** Saklanan kırpılmış/karantina kopyası sayısı */
const KEEP_COPIES = 3;

const saveKey = (id: string) => `frekans:save:${id}`;
const backupKey = (id: string) => `frekans:save:${id}:yedek`;
const preImportKey = (id: string) => `frekans:save:${id}:ice-aktarma-oncesi`;
const copiesKey = (id: string, kind: 'kesik' | 'bozuk') => `frekans:save:${id}:${kind}`;

export class GameStore {
  private save!: SaveData;
  private run!: RunState;
  private snap: GameSnapshot;
  private listeners = new Set<() => void>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private replayError: string | null = null;
  private lastCharacterCount = -1;
  private unsubExternal: (() => void) | null = null;
  /** Bu deponun depoda gördüğü/yazdığı son kaydın updatedAt değeri */
  private lastSynced = 0;

  static incoming = new Set<IncomingListener>();
  static changes = new Set<ChangeListener>();

  constructor(
    readonly story: Story,
    private storage: KeyValueStorage,
  ) {
    this.loadFromStorage();
    this.snap = this.computeSnapshot();
    this.lastCharacterCount = this.characterCount(this.snap.view);
  }

  // ------------------------------------------------------------------ yükleme

  private readStored(): { raw: string | null; save: SaveData | null } {
    const raw = this.storage.get(saveKey(this.story.id));
    return { raw, save: parseSave(raw, this.story.id) };
  }

  /** Bir kopyayı (en fazla KEEP_COPIES) silinmeyecek bir listeye ekler */
  private keepCopy(kind: 'kesik' | 'bozuk', raw: string) {
    const key = copiesKey(this.story.id, kind);
    let list: { at: number; raw: string }[] = [];
    try {
      list = JSON.parse(this.storage.get(key) ?? '[]') as typeof list;
    } catch {
      list = [];
    }
    if (list.some((c) => c.raw === raw)) return;
    list.push({ at: Date.now(), raw });
    this.storage.set(key, JSON.stringify(list.slice(-KEEP_COPIES)));
  }

  private loadFromStorage() {
    const id = this.story.id;
    const { raw, save: primary } = this.readStored();
    if (raw && !primary) {
      console.warn('[Frekans] Ana kayıt okunamadı; karantinaya alındı');
      this.keepCopy('bozuk', raw);
    }
    const backup = primary ? null : parseSave(this.storage.get(backupKey(id)), id);
    const save = primary ?? backup;
    if (!save) {
      const fresh = newSave(id, this.story.version, Date.now());
      this.adopt(fresh, startRun(this.story, fresh.startedAt));
      this.writeRaw(fresh);
      return;
    }
    const { save: s, run } = this.rebuild(save);
    this.adopt(s, run);
    // Yedekten dönüldüyse hemen ana kayda yaz (bozuk kayıt yedeğe dönmesin)
    if (!primary || s !== save) this.writeRaw(s);
    else this.lastSynced = save.updatedAt;
  }

  private adopt(save: SaveData, run: RunState) {
    this.save = save;
    this.run = run;
  }

  /** Kayıttan sohbeti yeniden kurar. Uygulanamayan olay varsa orijinali saklanır. */
  private rebuild(save: SaveData): { save: SaveData; run: RunState } {
    const result = replay(this.story, save.startedAt, save.events);
    this.replayError = null;
    if (result.realigned > 0) {
      console.info(`[Frekans] Kayıt güncel hikayeye hizalandı (${result.realigned} nokta)`);
    }
    if (result.error) {
      this.replayError = result.error;
      console.warn(`[Frekans] Kayıt kısmen oynatılabildi (${result.applied}/${save.events.length}): ${result.error}`);
      this.keepCopy('kesik', JSON.stringify(save));
      return { save: { ...save, events: result.run.events.slice() }, run: result.run };
    }
    return { save, run: result.run };
  }

  /** Depoya yaz; önceki sağlam ana kaydı yedeğe al */
  private writeRaw(save: SaveData, rotateBackup = true) {
    const id = this.story.id;
    if (rotateBackup) {
      const current = this.storage.get(saveKey(id));
      // Yalnızca okunabilen bir kayıt yedeğe geçer (bozuk kayıt sağlam yedeğin yerini almasın)
      if (current && parseSave(current, id)) this.storage.set(backupKey(id), current);
    }
    const updatedAt = Math.max(Date.now(), this.lastSynced + 1);
    this.save = { ...save, updatedAt };
    this.storage.set(saveKey(id), JSON.stringify(this.save));
    this.lastSynced = updatedAt;
  }

  /**
   * Depoda bu deponun bilmediği daha yeni bir kayıt var mı? Varsa onu al.
   * Her değiştiren işlemden önce çağrılır: eski bir sekme yeni ilerlemenin üzerine yazamaz.
   */
  private syncFromStorage(): boolean {
    const { save } = this.readStored();
    if (!save || save.updatedAt <= this.lastSynced) return false;
    const { save: s, run } = this.rebuild(save);
    this.adopt(s, run);
    this.lastSynced = save.updatedAt;
    this.lastCharacterCount = -1; // geri dönüşte ses çalma
    return true;
  }

  private persist(reason: ChangeReason) {
    this.writeRaw({ ...this.save, events: this.run.events.slice() });
    this.emitChange(reason);
  }

  private emitChange(reason: ChangeReason) {
    GameStore.changes.forEach((l) => {
      try {
        l(this, reason);
      } catch (e) {
        console.warn('[Frekans] değişiklik dinleyicisi hatası', e);
      }
    });
  }

  // ------------------------------------------------------------------ dışa açık okuma

  getSave(): SaveData {
    return { ...this.save, events: this.run.events.slice() };
  }

  getRun(): RunState {
    return this.run;
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
      if (key === saveKey(this.story.id) && this.syncFromStorage()) {
        this.refresh();
        this.emitChange('sync');
      }
    });
    // Dinleyicisizken kaçırılmış değişiklikleri al
    if (this.syncFromStorage()) this.emitChange('sync');
    this.refresh();
    this.emitChange('load');
  }

  private deactivate() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.unsubExternal?.();
    this.unsubExternal = null;
  }

  // ------------------------------------------------------------------ zaman

  now(): number {
    return virtualNow(this.save.clock);
  }

  get clock(): ClockState {
    return this.save.clock;
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
      this.syncFromStorage();
      this.save = { ...this.save, endingsSeen: [...new Set([...this.save.endingsSeen, view.ending.id])] };
      this.writeRaw(this.save);
    }

    this.listeners.forEach((l) => l());
    if (this.listeners.size === 0) return;

    const clock = this.save.clock;
    if (clock.instant && view.nextChangeAt !== null && !view.choices) {
      const target = view.nextChangeAt;
      this.timer = setTimeout(() => {
        this.save = { ...this.save, clock: advancedTo(this.save.clock, target) };
        this.writeRaw(this.save, false);
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
    if (this.syncFromStorage()) {
      // Başka bir yerde ilerleme olmuş; ekran güncellensin, oyuncu yeni duruma göre seçsin
      this.refresh();
      return false;
    }
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
    this.persist('choice');
    this.refresh();
    return true;
  }

  markRead() {
    const msgs = this.snap.view.messages;
    const last = msgs[msgs.length - 1];
    if (!last || last.at <= this.save.lastReadAt) return;
    this.syncFromStorage();
    this.save = { ...this.save, lastReadAt: Math.max(this.save.lastReadAt, last.at) };
    this.writeRaw(this.save, false);
    this.snap = { ...this.snap, unread: 0 };
    this.listeners.forEach((l) => l());
  }

  /** Hikayeyi baştan başlat (görülen sonlar korunur; önceki oyun yedekte kalır) */
  restart() {
    this.syncFromStorage();
    this.keepCopy('kesik', JSON.stringify(this.getSave()));
    const fresh = newSave(this.story.id, this.story.version, this.now(), this.save);
    this.adopt(fresh, startRun(this.story, fresh.startedAt));
    this.replayError = null;
    this.lastCharacterCount = 0;
    this.writeRaw(fresh);
    this.emitChange('restart');
    this.refresh();
  }

  exportCode(): string {
    return encodeSaveCode(this.getSave());
  }

  /** Kayıt kodunu yükler. Mevcut ilerleme ayrı bir anahtarda saklanır; görülen sonlar birleştirilir. */
  importCode(code: string): ImportResult {
    const decoded = decodeSaveCode(code, this.story.version);
    if ('error' in decoded) return { ok: false, message: decoded.error };
    if (decoded.storyId !== this.story.id) return { ok: false, message: 'Bu kod başka bir hikayeye ait.' };
    this.syncFromStorage();
    this.storage.set(preImportKey(this.story.id), JSON.stringify(this.getSave()));
    const merged: SaveData = {
      ...decoded,
      endingsSeen: [...new Set([...this.save.endingsSeen, ...decoded.endingsSeen])],
    };
    const { save, run } = this.rebuild(merged);
    this.adopt(save, run);
    this.lastCharacterCount = -1;
    this.writeRaw(save);
    this.emitChange('import');
    this.refresh();
    const total = decoded.events.length;
    if (this.replayError) {
      return {
        ok: true,
        message: `Kayıt kısmen yüklendi (${save.events.length}/${total} adım). Önceki ilerlemen ayrıca saklandı.`,
      };
    }
    return { ok: true, message: 'Kayıt yüklendi. Kaldığın yerden devam edebilirsin.' };
  }

  /** Sunucudaki yedek bu cihazdakinden ileri ise onu al (Faz 5: kurtarma kodu) */
  adoptRemote(remote: SaveData): boolean {
    if (remote.storyId !== this.story.id) return false;
    this.syncFromStorage();
    const local = this.getSave();
    const sameGame = remote.startedAt === local.startedAt;
    const ahead = remote.events.length > local.events.length || (!sameGame && remote.updatedAt > local.updatedAt);
    if (!ahead) return false;
    this.storage.set(preImportKey(this.story.id), JSON.stringify(local));
    const { save, run } = this.rebuild({
      ...remote,
      endingsSeen: [...new Set([...local.endingsSeen, ...remote.endingsSeen])],
    });
    this.adopt(save, run);
    this.lastCharacterCount = -1;
    this.writeRaw(save);
    this.emitChange('import');
    this.refresh();
    return true;
  }

  // ------------------------------------------------------------------ geliştirici

  setSpeed(speed: number, instant = false) {
    this.syncFromStorage();
    this.save = { ...this.save, clock: { ...withSpeed(this.save.clock, speed), instant } };
    this.writeRaw(this.save, false);
    this.emitChange('clock');
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
    this.syncFromStorage();
    this.save = { ...this.save, clock: advancedTo(this.save.clock, t) };
    this.writeRaw(this.save, false);
    this.emitChange('clock');
    this.refresh();
  }

  jumpTo(nodeId: string): string | null {
    this.syncFromStorage();
    const next = cloneRun(this.run);
    try {
      jumpInPlace(this.story, next, nodeId, this.now());
    } catch (e) {
      return e instanceof Error ? e.message : String(e);
    }
    this.run = next;
    this.persist('jump');
    this.refresh();
    return null;
  }

  /** Her şeyi sil: kayıt, yedek, görülen sonlar, saat ayarı (kırpılmış/karantina kopyaları kalır) */
  hardReset() {
    this.keepCopy('kesik', JSON.stringify(this.getSave()));
    this.storage.remove(backupKey(this.story.id));
    const fresh = { ...newSave(this.story.id, this.story.version, Date.now()), playthrough: 1, endingsSeen: [] };
    this.adopt(fresh, startRun(this.story, fresh.startedAt));
    this.replayError = null;
    this.lastCharacterCount = 0;
    this.lastSynced = 0;
    this.writeRaw(fresh, false);
    this.emitChange('reset');
    this.refresh();
  }

  /** Saat gerçek mi (push planlama yalnızca gerçek ya da hızlandırılmış saatte anlamlı) */
  isRealTime(): boolean {
    return isRealClock(this.save.clock);
  }
}

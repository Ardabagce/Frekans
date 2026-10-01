import { describe, expect, it } from 'vitest';

import { inClockWindow, nextOccurrence, timeOfDay } from '@/engine/calendar';
import { advancedTo, REAL_CLOCK, virtualNow, withSpeed } from '@/engine/clock';
import { MINUTE, toMs } from '@/engine/duration';
import { createStoryKit, defineStory } from '@/engine/kit';
import {
  applyChoice,
  EngineError,
  replay,
  startRun,
  TIMING,
  upcomingReturns,
  viewAt,
  type RunState,
} from '@/engine/runtime';
import { applyEffect, evaluate, initialVars } from '@/engine/state';
import type { Story } from '@/engine/types';
import { validateStory } from '@/engine/validate';
import { decodeSaveCode, encodeSaveCode, newSave } from '@/game/save';
import { dagEvi } from '@stories/dag-evi';

const at = (d: number, h: number, m = 0) => new Date(2026, 9, d, h, m, 0, 0).getTime(); // Ekim 2026

const k = createStoryKit({
  stats: { saglik: { label: 'Sağlık', initial: 80 }, moral: { label: 'Güven', initial: 50 } },
  injuries: { yanik: { label: 'Yanık' } },
  items: { ip: 'İp' },
  flags: { a: 'A bayrağı' },
});
const { say, system, away, sleepUntil, choice, node, is, fx } = k;

function testStory(): Story {
  return defineStory({
    id: 'test',
    version: '1',
    title: 'Test',
    character: { name: 'Deniz', avatar: { initials: 'D', color: '#000' } },
    start: 'start',
    defs: k.defs,
    endings: { iyi: { kind: 'iyi', title: 'İyi', summary: '' }, kotu: { kind: 'kotu', title: 'Kötü', summary: '' } },
    nudges: ['orada mısın?', 'lütfen cevap ver...', 'üçüncü'],
    nudgeAfter: ['3m', '20m', '40m'],
    quietHours: { from: '23:00', to: '08:00' },
    nodes: [
      node('start', {
        day: 1,
        onEnter: [fx.give('ip')],
        steps: [
          say('merhaba'),
          say('ikinci', { delay: '5s' }),
          say('elim yanık', { if: is.injury('yanik') }),
          system('Sinyal zayıf', { tone: 'warning' }),
        ],
        choices: [
          choice('İyi gidiyor', 'iyi', { effects: [fx.stat('moral', 10)] }),
          choice('Yak', 'yanik', { effects: [fx.injure('yanik')] }),
          choice('İpi tut', 'ip', { requires: is.not(is.injury('yanik')), lockedReason: 'Elin yanık, ipi tutamazsın.' }),
          choice('Gizli', 'iyi', { id: 'gizli', visibleIf: is.flag('a') }),
        ],
      }),
      node('iyi', { day: 1, steps: [say('tamam'), away({ for: '7m', notice: 'Deniz’in bağlantısı koptu' }), say('döndüm')], next: 'karar' }),
      node('yanik', { day: 1, steps: [say('ah')], next: 'start2' }),
      node('start2', {
        day: 1,
        steps: [say('şimdi ne yapayım')],
        choices: [
          choice('İpi tut', 'ip', { requires: is.not(is.injury('yanik')), lockedReason: 'Elin yanık, ipi tutamazsın.' }),
          choice('Uyu', 'uyku'),
        ],
      }),
      node('karar', { day: 1, next: [{ if: is.stat('moral', { gte: 60 }), to: 'son_iyi' }, { to: 'son_kotu' }] }),
      node('uyku', { day: 1, steps: [say('iyi geceler'), sleepUntil('08:00')], next: 'son_kotu' }),
      node('ip', { day: 1, steps: [say('tuttum')], ending: 'iyi' }),
      node('son_iyi', { day: 1, ending: 'iyi' }),
      node('son_kotu', { day: 1, ending: 'kotu' }),
    ],
  });
}

/** Seçimlerin göründüğü an */
const choicesAt = (run: RunState) => run.pending.at;

describe('süreler ve takvim', () => {
  it('okunabilir süreleri milisaniyeye çevirir', () => {
    expect(toMs('1h30m')).toBe(90 * MINUTE);
    expect(toMs('7m')).toBe(7 * MINUTE);
    expect(toMs('2m30s')).toBe(150_000);
    expect(toMs(500)).toBe(500);
    expect(() => toMs('yedi dakika')).toThrow();
    expect(() => toMs('5x')).toThrow();
  });

  it('bir sonraki yerel saat: aynı gün ya da ertesi gün', () => {
    expect(nextOccurrence(at(1, 7, 0), '08:00')).toBe(at(1, 8, 0));
    expect(nextOccurrence(at(1, 8, 0), '08:00')).toBe(at(2, 8, 0)); // kesinlikle sonrası
    expect(nextOccurrence(at(1, 23, 30), '08:00')).toBe(at(2, 8, 0));
  });

  it('gece yarısını aşan saat aralıkları ve günün bölümü', () => {
    expect(inClockWindow(at(1, 23, 30), '23:00', '08:00')).toBe(true);
    expect(inClockWindow(at(1, 3, 0), '23:00', '08:00')).toBe(true);
    expect(inClockWindow(at(1, 8, 0), '23:00', '08:00')).toBe(false);
    expect(timeOfDay(at(1, 7))).toBe('sabah');
    expect(timeOfDay(at(1, 13))).toBe('ogle');
    expect(timeOfDay(at(1, 19))).toBe('aksam');
    expect(timeOfDay(at(1, 2))).toBe('gece');
  });
});

describe('koşullar ve etkiler', () => {
  const defs = k.defs;
  it('bayrak, yara, eşya, değer ve bileşik koşullar', () => {
    const v = initialVars(defs);
    applyEffect(v, { set: 'a' }, defs);
    applyEffect(v, { injure: 'yanik' }, defs);
    const t = at(1, 12);
    expect(evaluate({ flag: 'a' }, v, t)).toBe(true);
    expect(evaluate({ injury: 'yanik' }, v, t)).toBe(true);
    expect(evaluate({ item: 'ip' }, v, t)).toBe(false);
    expect(evaluate({ stat: 'moral', gte: 50, lt: 51 }, v, t)).toBe(true);
    expect(evaluate({ all: [{ flag: 'a' }, { not: { item: 'ip' } }] }, v, t)).toBe(true);
    expect(evaluate({ any: [{ item: 'ip' }, { timeOfDay: 'ogle' }] }, v, t)).toBe(true);
    expect(evaluate({ time: { from: '22:00', to: '06:00' } }, v, t)).toBe(false);
  });

  it('değerler 0–100 arasında kırpılır, eşya alınıp verilir', () => {
    const v = initialVars(defs);
    applyEffect(v, { stat: 'moral', add: 80 }, defs);
    expect(v.stats.moral).toBe(100);
    applyEffect(v, { stat: 'saglik', add: -500 }, defs);
    expect(v.stats.saglik).toBe(0);
    applyEffect(v, { give: 'ip' }, defs);
    applyEffect(v, { take: 'ip' }, defs);
    expect(v.items.ip).toBeUndefined();
  });
});

describe('zaman çizelgesi (availableAt)', () => {
  const story = testStory();
  const t0 = at(1, 12);

  it('mesajları gecikme + yazıyor süresiyle sıralı planlar; koşullu satırı atlar', () => {
    const run = startRun(story, t0);
    const [m1, m2, sys, ...rest] = run.messages;
    expect(rest).toHaveLength(0); // "elim yanık" koşulu tutmadı
    expect(m1!.typingFrom).toBeGreaterThanOrEqual(t0 + TIMING.START_DELAY);
    expect(m1!.at).toBeGreaterThan(m1!.typingFrom!);
    expect(m2!.typingFrom).toBe(m1!.at + 5000); // açık gecikme
    expect(sys!.sender).toBe('system');
    expect(sys!.at).toBe(m2!.at + TIMING.SYSTEM_GAP);
    expect(run.pending).toMatchObject({ kind: 'choice', nodeId: 'start', at: sys!.at });
    expect(run.vars.items.ip).toBe(true); // onEnter
  });

  it('yazıyor süresi metin uzunluğuyla artar', () => {
    const run = startRun(story, t0);
    const [m1, m2] = run.messages;
    const d1 = m1!.at - m1!.typingFrom!;
    const long = startRun(
      defineStory({ ...story, nodes: [node('start', { day: 1, steps: [say('x'.repeat(80))], ending: 'iyi' })] }),
      t0,
    ).messages[0]!;
    expect(long.at - long.typingFrom!).toBeGreaterThan(d1);
    expect(m2).toBeDefined();
  });

  it('görünüm zamana göre açılır: önce yazıyor, sonra mesaj, en son seçimler', () => {
    const run = startRun(story, t0);
    const m1 = run.messages[0]!;
    const before = viewAt(story, run, m1.typingFrom! - 1);
    expect(before.messages).toHaveLength(0);
    expect(viewAt(story, run, m1.typingFrom! + 1).presence.kind).toBe('typing');
    const after = viewAt(story, run, m1.at);
    expect(after.messages.map((m) => m.id)).toEqual([m1.id]);
    expect(after.choices).toBeNull();
    const ready = viewAt(story, run, choicesAt(run));
    expect(ready.choices?.map((c) => c.id)).toEqual(['iyi', 'yanik', 'ip']); // "gizli" görünmez
    expect(ready.nextChangeAt).not.toBeNull();
  });

  it('uygulama kapalıyken geçen süre: ileri bir anda tüm mesajlar birden görünür', () => {
    const run = startRun(story, t0);
    const later = viewAt(story, run, t0 + 3 * 3600_000);
    // Planlanan tüm mesajlar + cevap verilmediği için düşen 2 dürtme
    expect(later.messages.length).toBe(run.messages.length + 2);
    expect(later.choices).not.toBeNull();
  });
});

describe('seçimler', () => {
  const story = testStory();
  const t0 = at(1, 12);

  it('kilitli seçim görünür ama seçilemez; sebebi gösterilir', () => {
    let run = startRun(story, t0);
    run = applyChoice(story, run, 'yanik', choicesAt(run) + 1000);
    expect(run.vars.injuries.yanik).toBe(true);
    const v = viewAt(story, run, choicesAt(run));
    const ip = v.choices?.find((c) => c.id === 'ip');
    expect(ip).toMatchObject({ locked: true, lockedReason: 'Elin yanık, ipi tutamazsın.' });
    expect(() => applyChoice(story, run, 'ip', choicesAt(run) + 1)).toThrow(EngineError);
    // Yanık sonrası koşullu satır artık görünür değil (farklı düğüm) ama yara kalıcı
    expect(v.choices?.find((c) => c.id === 'uyku')?.locked).toBe(false);
  });

  it('seçimler görünmeden cevap verilemez', () => {
    const run = startRun(story, t0);
    expect(() => applyChoice(story, run, 'iyi', choicesAt(run) - 1)).toThrow(EngineError);
  });

  it('oyuncu mesajı: tek tik → çift tik → mavi tik; cevap okuduktan sonra gelir', () => {
    let run = startRun(story, t0);
    const t = choicesAt(run) + 2000;
    run = applyChoice(story, run, 'iyi', t);
    const mine = run.messages.find((m) => m.sender === 'player')!;
    expect(mine.content).toEqual({ kind: 'text', text: 'İyi gidiyor' });
    const status = (time: number) => viewAt(story, run, time).messages.find((m) => m.id === mine.id)?.status;
    expect(status(t)).toBe('sent');
    expect(status(mine.deliveredAt!)).toBe('delivered');
    expect(status(mine.readAt!)).toBe('read');
    const reply = run.messages.find((m) => m.nodeId === 'iyi' && m.sender === 'character')!;
    expect(reply.typingFrom).toBeGreaterThan(mine.readAt!);
  });

  it('etkiler yolu değiştirir: güven ≥60 ise iyi son', () => {
    let run = startRun(story, t0);
    run = applyChoice(story, run, 'iyi', choicesAt(run));
    expect(run.vars.stats.moral).toBe(60);
    expect(run.pending).toMatchObject({ kind: 'ending', ending: 'iyi' });
  });
});

describe('görev, uyku ve durum satırı', () => {
  const story = testStory();
  const t0 = at(1, 12);

  it('görevdeyken "son görülme", dönünce mesaj; sistem notu düşer', () => {
    let run = startRun(story, t0);
    run = applyChoice(story, run, 'iyi', choicesAt(run));
    const a = run.aways[0]!;
    expect(a.to - a.from).toBe(7 * MINUTE);
    expect(viewAt(story, run, a.from + 60_000).presence).toEqual({ kind: 'lastSeen', at: a.from });
    expect(run.messages.some((m) => m.content.kind === 'system' && m.content.text === 'Deniz’in bağlantısı koptu')).toBe(true);
    const back = run.messages.find((m) => m.content.kind === 'text' && m.content.text === 'döndüm')!;
    expect(back.typingFrom).toBeGreaterThanOrEqual(a.to);
  });

  it('çevrimiçi kalma süresi dolunca "son görülme"ye düşer', () => {
    const run = startRun(story, t0);
    const p = choicesAt(run);
    expect(viewAt(story, run, p + 10_000).presence.kind).toBe('online');
    // İlk dürtme (3. dk) yazılmaya başlamadan önce
    const later = viewAt(story, run, p + TIMING.ONLINE_LINGER + 5_000).presence;
    expect(later.kind).toBe('lastSeen');
  });

  it('uyku bir sonraki 08:00e kadar sürer (en az 2 saat)', () => {
    let run = startRun(story, at(1, 6, 50));
    run = applyChoice(story, run, 'yanik', choicesAt(run));
    run = applyChoice(story, run, 'uyku', choicesAt(run));
    const sleep = run.aways.at(-1)!;
    expect(new Date(sleep.to).getHours()).toBe(8);
    // 07:xx'te uyuyunca 1 saatten kısa kalacağı için ertesi güne kayar
    expect(sleep.to - sleep.from).toBeGreaterThanOrEqual(2 * 3600_000);
  });
});

describe('dürtmeler', () => {
  const story = testStory();

  it('gündüz en fazla 2 dürtme, 3 ve 20 dk sonra', () => {
    const run = startRun(story, at(1, 12));
    if (run.pending.kind !== 'choice') throw new Error('seçim bekleniyordu');
    const p = run.pending;
    expect(p.nudges.map((n) => n.at - p.at)).toEqual([3 * MINUTE, 20 * MINUTE]);
    const v = viewAt(story, run, p.at + 21 * MINUTE);
    expect(v.messages.filter((m) => m.content.kind === 'text' && m.content.text === 'orada mısın?')).toHaveLength(1);
  });

  it('gece sessiz saatlerde dürtme gönderilmez', () => {
    const run = startRun(story, at(1, 23, 10));
    if (run.pending.kind !== 'choice') throw new Error('seçim bekleniyordu');
    expect(run.pending.nudges).toHaveLength(0);
  });

  it('cevaptan önce düşen dürtme kalıcı olur, sonrakiler iptal', () => {
    let run = startRun(story, at(1, 12));
    const p = run.pending.at;
    run = applyChoice(story, run, 'yanik', p + 5 * MINUTE);
    const nudgeTexts = run.messages.filter((m) => m.id.includes('.n')).map((m) => (m.content.kind === 'text' ? m.content.text : ''));
    expect(nudgeTexts).toEqual(['orada mısın?']);
  });
});

describe('kayıt ve yeniden oynatma', () => {
  const story = testStory();
  const t0 = at(1, 12);

  it('aynı olay dizisi aynı sohbeti üretir (deterministik)', () => {
    let run = startRun(story, t0);
    run = applyChoice(story, run, 'yanik', choicesAt(run) + 4000);
    run = applyChoice(story, run, 'uyku', choicesAt(run) + 90_000);
    const r = replay(story, t0, run.events);
    expect(r.error).toBeUndefined();
    expect(r.applied).toBe(2);
    expect(r.run.messages).toEqual(run.messages);
    expect(r.run.pending).toEqual(run.pending);
  });

  it('hikayeden silinmiş seçim: yalnızca o noktada durur', () => {
    const r = replay(story, t0, [
      { type: 'choice', node: 'start', choice: 'yanik', at: t0 + 60_000 },
      { type: 'choice', node: 'olmayan', choice: 'x', at: t0 + 120_000 },
    ]);
    expect(r.applied).toBe(1);
    expect(r.error).toMatch(/artık yok/);
  });

  it('oynanmış düğüme satır eklemek hızlı cevap veren oyuncunun kaydını kesmez', () => {
    let run = startRun(story, t0);
    run = applyChoice(story, run, 'yanik', choicesAt(run) + 200); // seçimler çıkar çıkmaz cevap
    run = applyChoice(story, run, 'uyku', choicesAt(run) + 200);
    // Yayından sonra başlangıç düğümüne uzun bir satır eklendi: seçimler artık daha geç çıkıyor
    const edited = defineStory({
      ...story,
      nodes: Object.values(story.nodes).map((n) =>
        n.id === 'start' ? { ...n, steps: [...n.steps, say('x'.repeat(120), { delay: '20s' })] } : n,
      ),
    });
    const r = replay(edited, t0, run.events);
    expect(r.error).toBeUndefined();
    expect(r.applied).toBe(2);
    expect(r.run.vars.injuries.yanik).toBe(true);
    expect(r.run.pending.kind).toBe('ending');
  });

  it('dal farkı (ör. saat dilimi değişti): kayıttaki düğüme hizalanır, ilerleme silinmez', () => {
    let run = startRun(story, t0);
    run = applyChoice(story, run, 'yanik', choicesAt(run) + 1000);
    // Kayıt "start2" düğümünü bekliyor; hikaye değişip "yanik" artık başka yere gidiyorsa
    const edited = defineStory({
      ...story,
      nodes: Object.values(story.nodes).map((n) => (n.id === 'yanik' ? { ...n, next: 'karar' } : n)),
    });
    const events = [...run.events, { type: 'choice' as const, node: 'start2', choice: 'uyku', at: choicesAt(run) + 5000 }];
    const r = replay(edited, t0, events);
    expect(r.error).toBeUndefined();
    expect(r.applied).toBe(2);
    expect(r.realigned).toBe(1);
    expect(r.run.pending.kind).toBe('ending');
  });

  it('kayıt kodu gidiş-dönüş', () => {
    const save = {
      ...newSave('test', '1', t0),
      events: [{ type: 'choice' as const, node: 'start', choice: 'yanik', at: t0 + 5000 }],
      endingsSeen: ['iyi'],
    };
    const code = encodeSaveCode(save);
    expect(code.startsWith('FRK1-')).toBe(true);
    const back = decodeSaveCode(code, '1');
    expect('error' in back).toBe(false);
    if ('error' in back) return;
    expect(back.events).toEqual(save.events);
    expect(back.startedAt).toBe(t0);
    expect(back.endingsSeen).toEqual(['iyi']);
    expect('error' in decodeSaveCode('FRK1-bozuk!!', '1')).toBe(true);
    expect('error' in decodeSaveCode('merhaba', '1')).toBe(true);
  });

  it('push için dönüş anları: ≥60 sn sessizlikten sonra gelen ilk mesaj', () => {
    let run = startRun(story, t0);
    const p = choicesAt(run);
    run = applyChoice(story, run, 'iyi', p);
    const returns = upcomingReturns(run, p);
    expect(returns.map((r) => r.text)).toContain('döndüm');
  });
});

describe('sanal saat', () => {
  it('60x hızda bir gerçek dakika bir sanal saattir; ileri sarma geri gitmez', () => {
    const real = 1_000_000;
    const c = withSpeed(REAL_CLOCK, 60, real);
    expect(virtualNow(c, real + 60_000) - virtualNow(c, real)).toBe(3_600_000);
    const c2 = advancedTo(c, virtualNow(c, real) - 5000, real);
    expect(virtualNow(c2, real)).toBe(virtualNow(c, real));
  });
});

describe('doğrulama', () => {
  it('test hikayesi temiz', () => {
    expect(validateStory(testStory()).filter((i) => i.level === 'error')).toEqual([]);
  });

  it('kırık bağlantı, tanımsız bayrak ve çıkışsız düğüm yakalanır', () => {
    const s = testStory();
    const broken: Story = {
      ...s,
      nodes: {
        ...s.nodes,
        start: { ...s.nodes.start!, choices: [{ id: 'x', text: 'x', to: 'yok', requires: { flag: 'tanimsiz' } }] },
        cikmaz: { id: 'cikmaz', day: 1, steps: [] },
      },
    };
    const msgs = validateStory(broken).filter((i) => i.level === 'error').map((i) => i.message);
    expect(msgs.some((m) => m.includes('Kırık bağlantı'))).toBe(true);
    expect(msgs.some((m) => m.includes('Tanımsız bayrak "tanimsiz"'))).toBe(true);
    expect(msgs.some((m) => m.includes('Çıkışı olmayan düğüm'))).toBe(true);
  });

  it('Dağ Evi hikayesi hatasız', () => {
    expect(validateStory(dagEvi).filter((i) => i.level === 'error')).toEqual([]);
  });
});

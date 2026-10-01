/// <reference types="node" />
/**
 * Rastgele oyun simülasyonu: npm run simulate-story -- [oyun-sayısı] [hikaye-id]
 *
 * Her oyunda rastgele bir başlangıç saati seçilir; oyuncu açık (kilitsiz) seçeneklerden
 * rastgele birini, rastgele bir cevap süresiyle seçer. Takılan yollar, motor hataları,
 * hiç ziyaret edilmeyen düğümler, sonuç dağılımı ve ilk oturum süresi raporlanır.
 */
import { formatSpan, HOUR } from '@/engine/duration';
import { applyChoiceInPlace, resolveChoices, startRun, type RunState } from '@/engine/runtime';
import { playableStories } from '@stories/index';

const runs = Number(process.argv[2] ?? 300);
const only = process.argv[3];

/** Tekrarlanabilir rastgelelik (mulberry32) */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)]! : 0;
};

let failed = false;
for (const story of playableStories()) {
  if (only && story.id !== only) continue;
  const visited = new Set<string>();
  const outcomes = new Map<string, number>();
  const errors: string[] = [];
  const firstSession: number[] = [];
  const toEnding: number[] = [];
  const statRange: Record<string, [number, number]> = {};
  let lockedSeen = 0;

  for (let i = 0; i < runs; i++) {
    const rand = rng(1000 + i);
    const base = new Date(2026, 9, 5, 0, 0, 0, 0).getTime();
    const startedAt = base + Math.floor(rand() * 24 * 60) * 60_000;
    let run: RunState;
    try {
      run = startRun(story, startedAt);
      for (let step = 0; step < 500; step++) {
        const p = run.pending;
        if (p.kind !== 'choice') break;
        const options = resolveChoices(story, run);
        lockedSeen += options.filter((o) => o.locked).length;
        const open = options.filter((o) => !o.locked);
        if (open.length === 0) {
          errors.push(`[oyun ${i}] ${p.nodeId}: açık seçenek yok (hepsi kilitli) — oyun takılır`);
          break;
        }
        const pick = open[Math.floor(rand() * open.length)]!;
        // Çoğunlukla hızlı cevap, bazen uzun süre sonra
        const r = rand();
        const answerDelay = r < 0.8 ? rand() * 20_000 : r < 0.95 ? rand() * 10 * 60_000 : rand() * 3 * HOUR;
        applyChoiceInPlace(story, run, pick.id, p.at + answerDelay);
      }
    } catch (e) {
      errors.push(`[oyun ${i}] motor hatası: ${e instanceof Error ? e.message : String(e)}`);
      continue;
    }
    run.trail.forEach((t) => visited.add(t.nodeId));
    const p = run.pending;
    const key = p.kind === 'ending' ? `son:${p.ending}` : p.kind === 'draft' ? `taslak:${p.nodeId}` : `${p.kind}:${p.nodeId}`;
    outcomes.set(key, (outcomes.get(key) ?? 0) + 1);
    if (p.kind === 'ending') toEnding.push((new Date(p.at).setHours(0, 0, 0, 0) - new Date(startedAt).setHours(0, 0, 0, 0)) / 86_400_000 + 1);
    if (p.kind === 'error') errors.push(`[oyun ${i}] ${p.reason}`);
    const longAway = run.aways.find((a) => a.to - a.from >= HOUR);
    if (longAway) firstSession.push(longAway.from - startedAt);
    for (const [k, v] of Object.entries(run.vars.stats)) {
      const r = statRange[k] ?? [v, v];
      statRange[k] = [Math.min(r[0], v), Math.max(r[1], v)];
    }
  }

  const all = Object.keys(story.nodes);
  const never = all.filter((id) => !visited.has(id));
  console.log(`\n■ ${story.title}: ${runs} rastgele oyun`);
  console.log('  Sonuçlar:');
  for (const [k, n] of [...outcomes.entries()].sort((a, b) => b[1] - a[1])) console.log(`    ${k.padEnd(36)} ${n}`);
  if (firstSession.length) {
    console.log(
      `  İlk oturum (ilk ≥1 saatlik araya kadar): en kısa ${formatSpan(Math.min(...firstSession))}, ortanca ${formatSpan(median(firstSession))}, en uzun ${formatSpan(Math.max(...firstSession))}`,
    );
  }
  if (toEnding.length) {
    const s = [...toEnding].sort((a, b) => a - b);
    console.log(`  Sona kadar takvim günü: en az ${s[0]}, ortanca ${s[Math.floor(s.length / 2)]}, en çok ${s[s.length - 1]}${s[0]! < 7 ? '  ⚠ 7 günden kısa oyun var' : ''}`);
  }
  console.log(`  Görülen kilitli seçenek sayısı: ${lockedSeen}`);
  console.log(`  Değer aralıkları (oyun sonu): ${Object.entries(statRange).map(([k, [a, b]]) => `${k} ${a}–${b}`).join(', ')}`);
  console.log(`  Ziyaret edilen düğüm: ${visited.size}/${all.length}`);
  const neverWritten = never.filter((id) => story.nodes[id]?.draft === undefined);
  if (neverWritten.length) console.log(`  ⚠ Hiç ziyaret edilmeyen yazılmış düğümler: ${neverWritten.join(', ')}`);
  if (errors.length) {
    failed = true;
    console.log(`  ✖ ${errors.length} hata:`);
    for (const e of errors.slice(0, 25)) console.log(`    ${e}`);
  } else {
    console.log('  ✓ Hata yok');
  }
}
if (failed) process.exit(1);

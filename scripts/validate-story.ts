/// <reference types="node" />
/**
 * Hikaye doğrulayıcı: npm run validate-story [hikaye-id]
 * Hata varsa çıkış kodu 1 olur (CI ve Vercel derlemesi için).
 */
import { describeEstimate, estimatePlaytime, validateStory, type Issue } from '@/engine/validate';
import { playableStories } from '@stories/index';

const only = process.argv[2];
const icon: Record<Issue['level'], string> = { error: '✖', warning: '⚠', info: '·' };
let errors = 0;

for (const story of playableStories()) {
  if (only && story.id !== only) continue;
  const nodes = Object.values(story.nodes);
  const drafts = nodes.filter((n) => n.draft !== undefined).length;
  console.log(`\n■ ${story.title} (${story.id}) — ${nodes.length} düğüm, ${drafts} taslak, ${Object.keys(story.endings).length} son`);

  const issues = validateStory(story);
  for (const level of ['error', 'warning', 'info'] as const) {
    for (const i of issues.filter((x) => x.level === level)) {
      console.log(`  ${icon[level]} ${i.node ? `[${i.node}] ` : ''}${i.message}`);
    }
  }
  const e = issues.filter((i) => i.level === 'error').length;
  const w = issues.filter((i) => i.level === 'warning').length;
  errors += e;
  console.log(`  → ${e} hata, ${w} uyarı`);

  console.log('\n  Minimum oynama süresi tahmini');
  const base = new Date();
  for (const hour of [9, 21]) {
    const start = new Date(base.getFullYear(), base.getMonth(), base.getDate() + 1, hour, 0, 0, 0).getTime();
    for (const line of describeEstimate(estimatePlaytime(story, start))) console.log(`  ${line}`);
  }
}

if (errors > 0) {
  console.error(`\n✖ Toplam ${errors} hata`);
  process.exit(1);
}
console.log('\n✓ Doğrulama tamam');

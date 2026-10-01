/// <reference types="node" />
/**
 * Hikaye ağacını Mermaid diyagramı olarak dışa aktarır.
 *   npm run story-graph                → docs/story-graph-<id>.md
 *   npm run story-graph -- --day 1     → yalnızca 1. gün (+ çıkış hedefleri)
 * GitHub ve VS Code (Mermaid eklentisiyle) bu dosyayı diyagram olarak gösterir.
 */
import fs from 'node:fs';
import path from 'node:path';

import type { Condition, Story, StoryNode } from '@/engine/types';
import { playableStories } from '@stories/index';

const args = process.argv.slice(2);
const dayArg = args.includes('--day') ? Number(args[args.indexOf('--day') + 1]) : undefined;

const esc = (s: string) => s.replace(/"/g, '#quot;').replace(/[<>]/g, '');
const short = (s: string, n = 38) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const mid = (id: string) => id.replace(/[^A-Za-z0-9_]/g, '_');

function condText(c: Condition): string {
  if ('flag' in c) return c.flag;
  if ('injury' in c) return c.injury;
  if ('item' in c) return `eşya:${c.item}`;
  if ('visited' in c) return `ziyaret:${c.visited}`;
  if ('stat' in c) {
    const parts = [c.gte !== undefined && `≥${c.gte}`, c.lte !== undefined && `≤${c.lte}`, c.gt !== undefined && `>${c.gt}`, c.lt !== undefined && `<${c.lt}`];
    return `${c.stat}${parts.filter(Boolean).join(',')}`;
  }
  if ('timeOfDay' in c) return [c.timeOfDay].flat().join('/');
  if ('time' in c) return `${c.time.from}-${c.time.to}`;
  if ('not' in c) return `!${condText(c.not)}`;
  if ('all' in c) return c.all.map(condText).join(' & ');
  return c.any.map(condText).join(' | ');
}

function label(n: StoryNode): string {
  const title = n.title ?? n.id;
  return esc(`${title}<br/><small>${n.id}</small>`);
}

function graph(story: Story): string {
  const all = Object.values(story.nodes);
  const shown = dayArg ? all.filter((n) => n.day === dayArg) : all;
  const shownIds = new Set(shown.map((n) => n.id));
  const lines = ['flowchart TD'];
  const external = new Set<string>();

  const byDay = new Map<number, StoryNode[]>();
  for (const n of shown) byDay.set(n.day, [...(byDay.get(n.day) ?? []), n]);
  for (const [day, list] of [...byDay.entries()].sort((a, b) => a[0] - b[0])) {
    lines.push(`  subgraph D${day}["Gün ${day}"]`);
    for (const n of list) {
      const l = label(n);
      if (n.ending) lines.push(`    ${mid(n.id)}(["🏁 ${l}"])`);
      else if (n.draft !== undefined) lines.push(`    ${mid(n.id)}["✎ ${l}"]`);
      else if (n.choices?.length) lines.push(`    ${mid(n.id)}{{"${l}"}}`);
      else lines.push(`    ${mid(n.id)}["${l}"]`);
    }
    lines.push('  end');
  }

  for (const n of shown) {
    n.choices?.forEach((c) => {
      if (!shownIds.has(c.to)) external.add(c.to);
      const lock = c.requires ? `🔒 ` : '';
      lines.push(`  ${mid(n.id)} -->|"${esc(lock + short(c.text))}"| ${mid(c.to)}`);
    });
    if (typeof n.next === 'string') {
      if (!shownIds.has(n.next)) external.add(n.next);
      lines.push(`  ${mid(n.id)} -.-> ${mid(n.next)}`);
    } else {
      n.next?.forEach((b) => {
        if (!shownIds.has(b.to)) external.add(b.to);
        lines.push(`  ${mid(n.id)} -.->${b.if ? `|"${esc(short(condText(b.if), 30))}"|` : ''} ${mid(b.to)}`);
      });
    }
  }
  for (const id of external) lines.push(`  ${mid(id)}[/"→ ${esc(id)}"/]`);

  lines.push('  classDef ending fill:#E3F4EF,stroke:#0E8C7F,color:#0B5F5A');
  lines.push('  classDef draft fill:#F4F4F4,stroke:#9AA5AB,stroke-dasharray:4 3,color:#62737C');
  const endings = shown.filter((n) => n.ending).map((n) => mid(n.id));
  const drafts = shown.filter((n) => n.draft !== undefined && !n.ending).map((n) => mid(n.id));
  if (endings.length) lines.push(`  class ${endings.join(',')} ending`);
  if (drafts.length) lines.push(`  class ${drafts.join(',')} draft`);
  return lines.join('\n');
}

for (const story of playableStories()) {
  const suffix = dayArg ? `-gun${dayArg}` : '';
  const file = path.resolve('docs', `story-graph-${story.id}${suffix}.md`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const legend = '> ⬡ seçim noktası · ✎ taslak · 🏁 son · düz ok: seçim (🔒 kilitlenebilir) · kesikli ok: otomatik geçiş';
  fs.writeFileSync(file, `# ${story.title} — hikaye ağacı${dayArg ? ` (Gün ${dayArg})` : ''}\n\n${legend}\n\n\`\`\`mermaid\n${graph(story)}\n\`\`\`\n`);
  console.log(`✓ ${path.relative(process.cwd(), file)}`);
}

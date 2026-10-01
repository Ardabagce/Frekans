/**
 * Frekans ikon üreticisi — tek bir SVG tasarımından tüm PNG ikonları üretir.
 * Kullanım: npm run icons
 *
 * Tasarım: koyu teal zemin üzerinde beyaz bir mesaj balonu; balonun içinde
 * karlı bir dağ silueti ve zirveden yayılan sinyal (frekans) dalgaları.
 */
import fs from 'node:fs';
import path from 'node:path';
import { Buffer } from 'node:buffer';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const TEAL = '#0E5E63';

/** 1024x1024 koordinatlarında, merkezde ~640px'lik işaret (balon + dağ + dalgalar) */
function glyph({ bubble = '#FFFFFF', ink = TEAL } = {}) {
  return `
  <g>
    <path fill="${bubble}" d="M332 250h360c66 0 120 54 120 120v236c0 66-54 120-120 120H452l-122 92c-12 9-28 0-26-15l14-81c-56-12-98-60-98-116V370c0-66 54-120 112-120z"/>
    <path fill="${ink}" d="M290 660l150-176 66 74 92-118 136 220z"/>
    <path fill="${bubble}" d="M598 440l-34 44 22-6 12 18 14-22 22 12z" opacity="0.9"/>
    <g fill="none" stroke="${ink}" stroke-width="26" stroke-linecap="round">
      <path d="M548 388a72 72 0 0 1 100 0"/>
      <path d="M512 342a124 124 0 0 1 172 0"/>
    </g>
    <circle cx="598" cy="428" r="18" fill="${ink}"/>
  </g>`;
}

const background = `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#16807C"/>
      <stop offset="1" stop-color="#0A4A50"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>`;

const svg = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${body}</svg>`;

/** İşareti merkez etrafında ölçekle (maskable / adaptive ikon güvenli alanı için) */
const scaled = (s, body) => `<g transform="translate(512 512) scale(${s}) translate(-512 -512)">${body}</g>`;

const designs = {
  full: svg(background + glyph()),
  fullSafe: svg(background + scaled(0.78, glyph())),
  fg: svg(scaled(0.62, glyph())),
  bgOnly: svg(background),
  // Monokrom: yalnızca alfa kanalı kullanılır; dağ ve dalgalar balondan oyulur
  mono: svg(
    `<defs><mask id="m">${scaled(0.62, glyph({ bubble: '#FFFFFF', ink: '#000000' }))}</mask></defs>` +
      `<rect width="1024" height="1024" fill="#FFFFFF" mask="url(#m)"/>`,
  ),
  splash: svg(glyph({ bubble: '#FFFFFF', ink: TEAL })),
};

const outputs = [
  ['assets/icon.png', designs.full, 1024],
  ['assets/favicon.png', designs.full, 64],
  ['assets/splash-icon.png', designs.splash, 512],
  ['assets/android-icon-foreground.png', designs.fg, 1024],
  ['assets/android-icon-background.png', designs.bgOnly, 1024],
  ['assets/android-icon-monochrome.png', designs.mono, 1024],
  // PWA (Faz 4'te manifest bunları kullanır)
  ['public/icons/icon-192.png', designs.full, 192],
  ['public/icons/icon-512.png', designs.full, 512],
  ['public/icons/maskable-512.png', designs.fullSafe, 512],
  ['public/icons/apple-touch-icon.png', designs.fullSafe, 180],
  ['public/icons/badge-96.png', designs.mono, 96],
];

for (const [rel, design, size] of outputs) {
  const file = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await sharp(Buffer.from(design)).resize(size, size).png({ compressionLevel: 9 }).toFile(file);
  console.log(`✓ ${rel} (${size}px)`);
}
fs.writeFileSync(path.join(ROOT, 'public/icons/icon.svg'), designs.full);
console.log('✓ public/icons/icon.svg');

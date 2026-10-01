/**
 * Web derlemesi + sürüm damgası: npm run build:web (Vercel de bunu çalıştırır)
 *
 * 1. Bir derleme kimliği belirler (Vercel'de commit SHA, yerelde git SHA ya da zaman)
 * 2. Kimliği uygulamaya gömerek `expo export -p web` çalıştırır (EXPO_PUBLIC_BUILD_ID)
 * 3. dist/version.json yazar: açık olan uygulama bunu sorup yeni sürüm varsa kendini yeniler
 * 4. dist/sw.js içindeki önbellek adını kimlikle değiştirir: eski önbellekler temizlenir
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');

function buildId() {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA;
  if (sha) return sha.slice(0, 7);
  try {
    const local = execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim();
    const dirty = execSync('git status --porcelain', { cwd: ROOT }).toString().trim() ? '-yerel' : '';
    return `${local}${dirty}`;
  } catch {
    return `t${Date.now().toString(36)}`;
  }
}

const id = buildId();
console.log(`Derleme kimliği: ${id}`);
// --clear: Metro önbelleği EXPO_PUBLIC_* değişince paketi yeniden üretmez; kimlik eski kalırdı
execSync('npx expo export -p web --clear', {
  cwd: ROOT,
  stdio: 'inherit',
  env: { ...process.env, EXPO_PUBLIC_BUILD_ID: id },
});

const dist = path.join(ROOT, 'dist');
fs.writeFileSync(path.join(dist, 'version.json'), JSON.stringify({ build: id, at: new Date().toISOString() }) + '\n');

const swPath = path.join(dist, 'sw.js');
const sw = fs.readFileSync(swPath, 'utf8');
if (!sw.includes("const VERSION = 'frekans-v1';")) throw new Error('sw.js içinde VERSION satırı bulunamadı');
fs.writeFileSync(swPath, sw.replace("const VERSION = 'frekans-v1';", `const VERSION = 'frekans-${id}';`));
console.log('✓ version.json ve sw.js damgalandı');

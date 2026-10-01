# Frekans

Zayıf bir sinyal üzerinden sana ulaşan birine yardım ettiğin, mesajlaşma tabanlı ve gerçek zamanlı akan interaktif bir hikaye oyunu.

> Durum: **Faz 1** — mesajlaşma arayüzü sahte verilerle çalışıyor. Hikaye motoru, PWA ve bildirimler sonraki fazlarda.

## Gereksinimler

- **Node.js 22 LTS** (Expo SDK 57, Node 22.13+ ister) — <https://nodejs.org>
- npm

## Yerelde çalıştırma

```bash
npm install
npm run web        # tarayıcıda açar (http://localhost:8081)
```

Telefonda denemek için: bilgisayar ve telefon aynı Wi‑Fi'deyken `npm run web` çıktısındaki ağ adresini (ör. `http://192.168.1.20:8081`) telefonun tarayıcısında aç.

## Komutlar

| Komut | Ne yapar |
|---|---|
| `npm run web` | Geliştirme sunucusu (web) |
| `npm run build:web` | Statik web çıktısı → `dist/` |
| `npm test` | Birim testleri (vitest) |
| `npm run typecheck` | TypeScript kontrolü |
| `npm run lint` | ESLint |

## Vercel'e deploy

Repo Vercel'e bağlandığında ayarlar `vercel.json`'dan okunur (build: `npx expo export -p web`, çıktı: `dist`). Vercel'de **Add New → Project → GitHub reposunu seç → Deploy** yeterli; ek ayar gerekmez. Her `main` push'u otomatik deploy edilir.

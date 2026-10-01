# Hikaye Yazım Rehberi

Bu dosya, Frekans hikayelerinin **formatını** anlatır: düğüm, seçim, kilitli seçim, kalıcı yara, zaman ve sonlar.

Hikayenin içeriği (karakterler, kurallar, üslup, gün gün plan) için: [stories/dag-evi/HIKAYE.md](stories/dag-evi/HIKAYE.md)

---

## 1. Dosyalar

```
stories/
├─ index.ts                ← hikaye kayıt defteri (sohbet listesi sırası, kilitli hikayeler)
└─ dag-evi/
   ├─ HIKAYE.md            ← hikaye rehberi (içerik kuralları)
   ├─ kit.ts               ← bayraklar, yaralar, eşyalar, değerler + yazım yardımcıları
   ├─ index.ts             ← montaj: başlangıç düğümü, dürtme metinleri, sessiz saatler
   ├─ gun1.ts … gun7.ts    ← günlere bölünmüş düğümler
   └─ sonlar.ts            ← son tanımları ve son düğümleri
```

Kodla hikaye tamamen ayrıdır. Hikayeyi değiştirmek için yalnızca `stories/` altına dokunmak yeterli.

Her dosya şu satırla başlar:

```ts
import type { StoryNode } from '@/engine/types';
import { say, voice, photo, location, deleted, system, away, sleepUntil, pause, effects, is, fx, choice, node, draft } from './kit';

export const gun1: StoryNode[] = [
  // düğümler…
];
```

---

## 2. Düğüm

Bir düğüm şunlardan oluşur:

- karakterin sırayla attığı **adımlar** (mesajlar, aralar, etkiler)
- ardından bir **çıkış**: seçimler, otomatik geçiş (`next`) ya da son (`ending`)

```ts
node('g1_soba', {
  day: 1,                       // zorunlu: hangi gün (1–7)
  title: 'Soba',                // isteğe bağlı: grafik ve geliştirici panelinde görünür
  onEnter: [fx.stat('pil', -2)],// isteğe bağlı: düğüme girince uygulanan etkiler
  steps: [
    say('tamam sobayı buldum'),
    say('kibritler ıslak ama 3 tane kuru var gibi'),
  ],
  choices: [
    choice('İnce çırayla başla', 'g1_soba_cira'),
    choice('Biraz gaz yağı dök', 'g1_soba_alev'),
  ],
});
```

**Düğüm kimlikleri** `g<gün>_<konu>` biçimindedir (ör. `g3_sirt_tirmanis`). Kimlikler kayıtlarda saklanır, bu yüzden yayına çıktıktan sonra **değiştirme**.

---

## 3. Mesaj adımları

| Yardımcı | Ne gösterir |
|---|---|
| `say('metin')` | Metin balonu |
| `voice(14, 'döküm metni')` | Sesli mesaj: 14 sn, "Metne çevir" ile döküm görünür |
| `photo('soba', 'altyazı')` | Fotoğraf: illüstrasyon kimliği + isteğe bağlı altyazı |
| `location('Dağ evi · Kaçkar', 40.8862, 41.1517)` | Konum kartı |
| `deleted()` | "Bu mesaj silindi" |
| `system('Sinyal zayıf', { tone: 'warning' })` | Ortada gri sistem kutusu |

**Zamanlama.** Her mesaj varsayılan olarak öncekinden ~0.9 sn sonra yazılmaya başlar. "yazıyor..." süresi metin uzunluğuyla orantılıdır (1.2–7 sn). Sesli mesajda başlıkta "ses kaydediyor..." görünür. Değiştirmek istersen:

```ts
say('…', { delay: '10s' })         // yazmaya başlamadan önce 10 sn sessizlik
say('YANDI', { typing: '400ms' })  // çok hızlı yazılan tek kelime
```

Süreler sayı (ms) ya da `'30s'`, `'7m'`, `'2h'`, `'1h30m'` biçiminde yazılır.

**Yazım hatası** elle yazılır:

```ts
say('kibirtler ıslak'), say('*kibritler')
```

**Fotoğraflar** `src/ui/illustrations/` altındaki SVG çizimlerdir. Şu an olanlar: `karli-pencere`, `soba`, `dag-silueti`. Yenisi için bkz. §10.

---

## 4. Koşullu mesajlar

Her adım bir `if` alabilir. Koşul, o adımın sırası geldiği andaki duruma bakar:

```ts
steps: [
  say('sobanın başındayım'),
  say('elim hâlâ zonkluyor', { if: is.injury('yanik_sag_el') }),
  say('dışarısı zifiri karanlık', { if: is.timeOfDay('gece') }),
  say('dışarısı bembeyaz, hiçbir şey görünmüyor', { if: is.timeOfDay('sabah', 'ogle') }),
  say('sana güveniyorum', { if: is.stat('moral', { gte: 70 }) }),
]
```

**Koşul yardımcıları:**

| Yardımcı | Anlamı |
|---|---|
| `is.flag('soba_yandi')` | bayrak var mı |
| `is.injury('yanik_sag_el')` | yara var mı |
| `is.item('harita')` | eşya var mı |
| `is.stat('pil', { lte: 10 })` | sayısal değer (`gte` ≥, `lte` ≤, `gt` >, `lt` <) |
| `is.visited('g1_disari')` | bu düğüme daha önce girildi mi |
| `is.timeOfDay('gece', 'aksam')` | oyuncunun yerel saatine göre: sabah 06–12, ogle 12–17, aksam 17–22, gece 22–06 |
| `is.between('17:00', '06:00')` | saat aralığı (gece yarısını aşabilir) |
| `is.not(…)`, `is.all(…, …)`, `is.any(…, …)` | birleştirme |

---

## 5. Seçimler

```ts
choice('Buton metni', 'hedef_dugum', {
  effects: [fx.stat('moral', +5)],       // seçilince uygulanır (hedef düğümden önce)
  message: 'Önce ince çırayla başla. Kibriti boşa harcama.', // isteğe bağlı: gönderilen mesaj butondan farklıysa
  id: 'cira',                             // isteğe bağlı: sabit kimlik (bkz. aşağı)
})
```

- Her seçim noktasında **2–4 seçenek** olur.
- Buton metni oyuncunun Deniz'e yazdığı mesajdır; kısa tut.
- Seçimin **kimliği** verilmezse hedef düğüm kimliği kullanılır. Aynı hedefe giden ikinci seçim `-2` eki alır.
- Kimlikler kayıtta saklanır. Yayından sonra bir seçimin hedefini değiştireceksen eski kimliği `id` ile sabitle.

### Kilitli seçim (gizlenmez!)

```ts
choice('İpi tut ve tırman', 'g4_tirmanis', {
  requires: is.not(is.injury('yanik_sag_el')),
  lockedReason: 'Elin yanık, ipi tutamazsın.',
})
```

`requires` sağlanmazsa seçenek **gri ve üstü çizili** görünür, altında sebep yazar. Oyuncu geçmiş kararının bedelini görür.

- `lockedReason` kısa olsun: tek cümle, "sen" diliyle.
- Gizlemek yalnızca hiç anlamı olmayan seçenekler içindir, ör. hiç bulunmamış bir eşya: `visibleIf: is.item('balta')`.

### Güvene bağlı tepki

```ts
node('g3_oneri', {
  day: 3,
  steps: [],
  next: [
    { if: is.stat('moral', { lte: 25 }), to: 'g3_reddeder' }, // güven düşükse önerini reddeder
    { to: 'g3_kabul' },                                        // son dal koşulsuz olmalı
  ],
});
```

---

## 6. Etkiler

```ts
fx.set('soba_yandi')        // bayrak ekle          fx.unset('…')  bayrak kaldır
fx.injure('yanik_sag_el')   // kalıcı yara ekle     fx.heal('…')   iyileştir
fx.give('balta')            // eşya ekle            fx.take('…')   eşya çıkar
fx.stat('saglik', -15)      // sayısal değeri değiştir (0–100 arasında kırpılır)
fx.statTo('pil', 5)         // doğrudan ayarla
```

Etkiler üç yerde kullanılabilir:

| Yer | Ne zaman uygulanır |
|---|---|
| seçimin `effects` alanı | seçilince |
| düğümün `onEnter` alanı | düğüme girince |
| adım olarak `effects([fx.stat('pil', -3)], { if: … })` | sırası gelince |

**Değerler** (Dağ Evi):

| Değer | Anlamı |
|---|---|
| `saglik` | genel sağlık |
| `moral` | Deniz'in oyuncuya güveni |
| `pil` | telefon şarjı (%) |
| `isi` | vücut ısısı / üşüme |

### Yeni kalıcı yara ekleme (örnek: donmuş parmaklar)

1. `stories/dag-evi/kit.ts` → `injuries` içine ekle:
   ```ts
   donmus_parmaklar: { label: 'Donmuş parmaklar', description: 'Uzun yürüyüşler kilitlenir.' },
   ```
2. Bir seçimde ver:
   ```ts
   choice('Eldivensiz devam et', 'g4_sirt', { effects: [fx.injure('donmus_parmaklar'), fx.stat('saglik', -10)] })
   ```
3. Sonraki günlerde kilitle ve karakter ondan bahsetsin:
   ```ts
   choice('Vadiye kadar yürü', 'g6_vadi', {
     requires: is.not(is.injury('donmus_parmaklar')),
     lockedReason: 'Ayak parmaklarını hissetmiyorsun; o kadar yürüyemezsin.',
   })
   say('parmaklarım mosmor', { if: is.injury('donmus_parmaklar') })
   ```
4. `npm run validate-story` ile kontrol et.

---

## 7. Zaman: görevler, aralar, uyku

| Yardımcı | Ne yapar |
|---|---|
| `away({ for: '7m', notice: 'Deniz’in bağlantısı koptu' })` | Karakter 7 dk çevrimdışı. Başlık "son görülme bugün 14:32" olur, ortada sistem notu düşer, dönünce sonraki adımlar gelir. Oyuncuya push bildirimi gider. |
| `away({ until: '20:00' })` | Bir sonraki yerel 20:00'e kadar. |
| `sleepUntil('08:00', { notice: 'Deniz’in telefonu kapandı' })` | Bir sonraki 08:00'e kadar uyku. En az 2 saat sürer; daha yakınsa ertesi güne kayar. |
| `pause('30s')` | Çevrimiçi ama sessiz (okuyor, düşünüyor). |
| `away({ for: '2m30s', askNotifications: true })` | İlk kısa ara. Bu sırada uygulama "Deniz döndüğünde haberin olsun" diye bildirim izni ister. Hikaye başına bir kez. |

### Gün sonunu oyuncunun saatine bağlama

```ts
node('g1_gun_sonu', {
  day: 1,
  next: [
    { if: is.between('17:00', '06:00'), to: 'g1_uyku' }, // akşam/gece: doğrudan uyku
    { to: 'g1_aksam_ara' },                              // gündüz: akşam 8'e kadar ara, kısa akşam oturumu, sonra uyku
  ],
});
```

### Dürtmeler

Oyuncu cevap vermezse Deniz 3 ve 20 dk sonra dürter ("orada mısın?", "lütfen cevap ver..."):

- en fazla 2 kez
- 23:00–08:00 arası hiç
- metinler `dag-evi/index.ts` içinde
- düğüme özel metin: `nudges: ['hâlâ orada mısın?', 'Frekans?']`
- kapatmak için: `nudges: false`

---

## 8. Sonlar

```ts
// sonlar.ts
export const ENDINGS = {
  tam_kurtulus: { kind: 'iyi', title: 'Tam Kurtuluş', summary: '…' },
  // kind: 'iyi' | 'kismi' | 'kotu' | 'olum'
};

node('son_tam_kurtulus', {
  day: 7,
  steps: [say('helikopter!!'), system('Deniz güvende')],
  ending: 'tam_kurtulus',
});
```

- Son düğümüne gelince seçim çubuğunun yerine son kartı ve **"Yeniden oyna"** çıkar.
- Bulunan sonlar oyuncunun cihazında saklanır.
- Bölüm (gün) sonları için düğüme `chapterEnd: 'Gün 2 sonu: uzakta bir ışık'` eklenir. Bu alan grafikte ve istatistikte kullanılır.

---

## 9. Taslak (henüz yazılmamış) düğümler

```ts
draft('g3_yol_ayrimi', 3, 'Yol Ayrımı', 'Üç yol tartışılır: evde kal / aşağı in / yukarı çık. ~10 dk.', {
  choices: [choice('Evde kalalım', 'g3_evde'), choice('Aşağı inelim', 'g3_asagi')],
});
```

- Taslaklar grafikte kesikli çizilir.
- Oyuncu bir taslağa ulaşırsa sohbet orada durur ve "devamı yakında" notu çıkar.
- Taslağı yazıya dökmek için `draft(...)` → `node(...)` yap, `steps` ekle, özet metnini `title`'a ya da yoruma taşı.

---

## 10. Yeni illüstrasyon ekleme

1. `src/ui/illustrations/YeniGorsel.tsx` dosyasını oluştur: `IllustrationProps` alan bir SVG bileşeni yaz (mevcutlara bak). Gradient id'leri için `useSvgId` kullan.
2. `src/ui/illustrations/ids.ts` → `ILLUSTRATION_IDS` içine kimliği ekle.
3. `src/ui/illustrations/index.tsx` → `ILLUSTRATIONS` içine kaydet.
4. Hikayede `photo('yeni-gorsel', 'altyazı')`.

---

## 11. Araçlar

| Komut | Ne yapar |
|---|---|
| `npm run validate-story` | Kırık bağlantı, ulaşılamayan / çıkışsız düğüm, tanımsız bayrak/yara/eşya, kilit sebebi eksik seçim, geçersiz süre vb. denetler. Ayrıca **minimum oynama süresini** (09:00 ve 21:00 başlangıç için), ilk oturum süresini ve ilk taslağı raporlar. Hata varsa çıkış kodu 1. |
| `npm run simulate-story -- 500` | 500 rastgele oyun oynar. Takılan yolları (ör. tüm seçenekleri kilitli bir nokta), motor hatalarını, hiç ziyaret edilmeyen düğümleri, sonuç dağılımını ve ilk oturum süresini raporlar. |
| `npm run story-graph` | `docs/story-graph-dag-evi.md` dosyasına Mermaid diyagramı yazar. GitHub'da ve VS Code'da diyagram olarak görünür. |
| `npm run story-graph -- --day 1` | Yalnızca 1. gün. |
| `npm test` | Motor birim testleri (Dağ Evi'nin doğrulamasını da içerir). |

---

## 12. Geliştirici modu (oyun içinde)

Sohbet başlığına (isme) 3 saniye içinde **7 kez** dokun. Panelde şunlar var:

- **Zaman:**
  - `1x` / `60x` / `Anında`. Anında modunda, seçim beklenmiyorsa saat kendiliğinden sonraki olaya atlar.
  - "Sonraki olay", "+10 dk", "+1 saat", "08:00'e".
- **Durum:** mevcut düğüm, bekleyen olay, bayraklar, yaralar, envanter, değer çubukları.
- **Düğüme atla:** arama kutusu + liste. Durum korunur, yalnızca konum değişir.
- **Sıfırla:** baştan başlat ya da tüm kaydı sil.

Canlıda kapatmak için Vercel ortam değişkeni: `EXPO_PUBLIC_DEV_TOOLS=false`.

---

## 13. Kayıtlar ve hikaye değişiklikleri

- Oyuncunun cihazında sohbetin kendisi saklanmaz. Saklananlar **başlangıç anı** ve **(düğüm, seçim, zaman)** listesidir. Sohbet her açılışta motor tarafından yeniden kurulur.
- Bu yüzden metin düzeltmeleri, yeni koşullu satırlar ve zamanlama değişiklikleri **mevcut oyunculara da yansır**.
- Yayından sonra yapılmaması gerekenler:
  - oynanmış bir düğümün **kimliğini** değiştirmek
  - bir seçimin **kimliğini** değiştirmek ya da onu başka bir düğüme taşımak
  - Bunları yaparsan, kayıt uyuşmayan noktaya kadar oynatılır ve oradan devam edilir.
- Büyük değişikliklerde `dag-evi/index.ts` içindeki `version`'ı artır.

/**
 * Gün 4 — "İzler" (İSKELET)
 *
 * g4_sabah dala göre yönlendirir:
 *   (A) evde      → işaretin yeri tartışması (isaret_yanlis_yer riski) → 2 saatlik yakın keşif
 *   (B) aşağıda   → kulübedeki ok → Ozan’ın notu → gece araması (fener gerekir) ya da kulübe
 *   (C) yukarıda  → zirve → bir anlık sinyal, Ozan’dan kesik bir sesli mesaj
 * Tempo: uzun görevler (20 dk – 2 saat), her dal kendi gece düğümüyle biter.
 */
import type { StoryNode } from '@/engine/types';

import { choice, draft, fx, is, node } from './kit';

export const gun4: StoryNode[] = [
  draft(
    'g4_sabah',
    4,
    'İzler',
    'Sabah ~08:00. Dala göre yönlendirme: rota_asagi → kulübe, rota_yukari → sırt, diğerleri → dağ evi.',
    {
      next: [
        { if: is.flag('rota_asagi'), to: 'g4_kulube_sabah' },
        { if: is.flag('rota_yukari'), to: 'g4_sirt_sabah' },
        { to: 'g4_ev_sabah' },
      ],
    },
  ),

  // ---- (A) Evde ----
  draft(
    'g4_ev_sabah',
    4,
    'Silinen Harfler',
    'Gece rüzgarı ve uğultu SOS’un yarısını silmiş (fotoğraf). Deniz harfleri ağaçların altına, rüzgarın silemeyeceği yere taşımak ister; açıklıkta kalırsa her gece yenilemek gerekecek. Bu tartışma Gün 6’da helikopterin işareti görüp görmeyeceğini belirler. Görev ~20 dk.',
    {
      choices: [
        choice('Açıklıkta yeniden yap, daha derin kaz', 'g4_ev_kesif', {
          id: 'g4_isaret_aciklik',
          requires: is.not(is.injury('burkulmus_ayak')),
          lockedReason: 'Ayağın burkuk; açıklıkta saatlerce kar kazamazsın.',
          effects: [fx.set('sos_isareti'), fx.unset('isaret_yanlis_yer'), fx.stat('isi', -6), fx.stat('moral', +2)],
        }),
        choice('Ağaçların altına al, rüzgar silmesin', 'g4_ev_kesif', {
          id: 'g4_isaret_agac',
          effects: [fx.set('sos_isareti'), fx.set('isaret_yanlis_yer'), fx.stat('isi', -2)],
        }),
        choice('Olduğu yerde, sadece silinenleri düzelt', 'g4_ev_kesif', {
          id: 'g4_isaret_duzelt',
          effects: [fx.set('sos_isareti'), fx.stat('isi', -3)],
        }),
        choice('Turuncu yağmurluğunu ortasına ser', 'g4_ev_kesif', {
          id: 'g4_isaret_yagmurluk',
          visibleIf: is.item('yagmurluk'),
          effects: [fx.set('sos_isareti'), fx.take('yagmurluk'), fx.stat('isi', -4), fx.stat('moral', +3)],
        }),
      ],
    },
  ),
  draft(
    'g4_ev_kesif',
    4,
    'Dere Kıyısı',
    'Öğleden sonra Deniz evden çok uzaklaşmadan Ozan’ı aramak ister. 2 saatlik keşif (away 2h) ya da düdükle seslenip beklemek. Dere kıyısında Ozan’ın eldiveni bulunabilir (ozan_izi). Burkuk ayakla iniş kilitli.',
    {
      choices: [
        choice('Dere kıyısına in, iz ara', 'g4_ev_gece', {
          id: 'g4_kesif_dere',
          requires: is.not(is.injury('burkulmus_ayak')),
          lockedReason: 'Ayağın burkuk; dere kıyısına inemezsin.',
          effects: [fx.set('ozan_izi'), fx.stat('isi', -8), fx.stat('pil', -3)],
        }),
        choice('Evden uzaklaşma, düdükle seslen', 'g4_ev_gece', { id: 'g4_kesif_duduk', effects: [fx.stat('moral', +1)] }),
        choice('Telefonu kapat, akşama kadar güç topla', 'g4_ev_gece', {
          id: 'g4_kesif_dinlen',
          effects: [fx.set('pil_tasarrufu'), fx.stat('saglik', +5)],
        }),
      ],
    },
  ),
  node('g4_ev_gece', {
    day: 4,
    title: 'Üç Kısa',
    draft:
      'Akşam soba başında; Deniz yorgun, mizahı azalmış. Uyumadan önce son kez düdük çalar. Cliffhanger: aşağıdan çok uzaktan üç kısa düdük sesi gelir: cevap mı, yankı mı? sleepUntil 08:00.',
    next: 'g5_sabah',
    chapterEnd: 'Gün 4 sonu: vadiden gelen üç kısa düdük',
  }),

  // ---- (B) Aşağıda ----
  draft(
    'g4_kulube_sabah',
    4,
    'Ok',
    'Kulübede uyanış; ayakları sızlıyor. Kapıdaki ok batıdaki kayalıkları gösteriyor. Önce kulübeyi aramak (eski bir düdük, birkaç kuru dal) ya da hemen oku izlemek.',
    {
      choices: [
        choice('Okun gösterdiği yöne git', 'g4_not', { id: 'g4_oku_izle', effects: [fx.stat('isi', -3)] }),
        choice('Önce kulübeyi didik didik ara', 'g4_not', {
          id: 'g4_kulube_ara',
          effects: [fx.give('duduk'), fx.stat('isi', +3), fx.stat('pil', -2)],
        }),
      ],
    },
  ),
  draft(
    'g4_not',
    4,
    'Ozan’ın Notu',
    'Kayalığın dibinde Ozan’ın çantası (ya da Gün 2’de çanta bulunduysa sadece taşın altına sıkıştırılmış bir not): "köprü yok. bacak kötü. batıdaki kaya oyuğundayım. ışık yakarsan görürüm. O." (ozan_izi). 2 saatlik arama sonrası hava kararıyor. Gece aramak fener gerektirir.',
    {
      choices: [
        choice('Fenerle izi sürmeye devam et', 'g4_ses', {
          id: 'g4_gece_arama',
          requires: is.all(is.item('kafa_lambasi'), is.not(is.flag('fener_kayboldu'))),
          lockedReason: 'Kafa lamban yok; karanlıkta iz süremezsin.',
          effects: [fx.set('ozan_izi'), fx.stat('isi', -8), fx.stat('saglik', -6)],
        }),
        choice('Kulübeye dön, sabah devam edersin', 'g4_kulube_gece', {
          effects: [fx.set('ozan_izi'), fx.stat('moral', -2)],
        }),
      ],
    },
  ),
  node('g4_ses', {
    day: 4,
    title: 'Karanlıkta Ad',
    draft:
      'Kafa lambasının dairesinde kar ve kaya. Deniz durup dinler. Cliffhanger: rüzgarın arasında biri adını söylüyor, ama ses nereden geliyor bilemiyor ve lambanın pili göz kırpıyor. Deniz kulübeye geri dönmek zorunda kalır. sleepUntil 08:00.',
    next: 'g5_sabah',
    chapterEnd: 'Gün 4 sonu: karanlıkta adını çağıran ses',
  }),
  node('g4_kulube_gece', {
    day: 4,
    title: 'Kulübede Bekleyiş',
    draft:
      'Kulübede ocak çıtırdıyor; Deniz notu tekrar tekrar okur, "bacak kötü" kısmında takılır. Cliffhanger: gece yarısı batı kayalıklarında bir ışık iki kez yanıp söner. Gün 2’deki ışığın aynısı. sleepUntil 08:00.',
    next: 'g5_sabah',
    chapterEnd: 'Gün 4 sonu: kayalıklarda yanıp sönen ışık',
  }),

  // ---- (C) Yukarıda ----
  draft(
    'g4_sirt_sabah',
    4,
    'Zirve',
    'Kovukta geceleyen için zirve 30 dk, evden çıkan için yine 2 saat (is.visited g3_kaya_siginagi). Rüzgar insanı yere yatıracak kadar sert. Zirvede tek çubuk sinyal gelip gider; telefonu nasıl tutacağı tartışılır.',
    {
      choices: [
        choice('Telefonu yüksekte tut, kıpırdama', 'g4_sinyal', { id: 'g4_sinyal_tut', effects: [fx.stat('isi', -6)] }),
        choice('Rüzgarı kesen kayanın arkasına geç', 'g4_sinyal', { id: 'g4_sinyal_kaya', effects: [fx.stat('isi', -2), fx.stat('pil', -2)] }),
      ],
    },
  ),
  draft(
    'g4_sinyal',
    4,
    'Kesik Ses',
    'Telefon titrer: Ozan’ın numarasından iki gün önce gönderilmiş, kesik kesik bir sesli mesaj ("...Deniz... kulübe... bacağım..."). Sinyal birkaç dakika kalır. Bu dakikalarla ne yapılacağı Gün 6–7 kurtarmasını belirler: kurtarma kaydına konum iletmek ekip_temas verir.',
    {
      choices: [
        choice('Konumunu kurtarma kaydına ilet', 'g4_sirt_gece', {
          id: 'g4_konum_ilet',
          requires: is.stat('pil', { gte: 12 }),
          lockedReason: 'Pil bu kadarını kaldırmaz.',
          effects: [fx.set('ekip_temas'), fx.set('konum_gonderildi'), fx.stat('pil', -6)],
        }),
        choice('Ozan’a sesli mesajla cevap ver', 'g4_sirt_gece', {
          id: 'g4_ozan_cevap',
          effects: [fx.set('ozan_izi'), fx.stat('moral', +5), fx.stat('pil', -4)],
        }),
        choice('Sinyal güçlenene kadar bekle', 'g4_sirt_gece', {
          id: 'g4_sinyal_bekle',
          effects: [fx.injure('donmus_parmaklar'), fx.stat('isi', -10), fx.stat('saglik', -6), fx.stat('pil', -3)],
        }),
      ],
    },
  ),
  node('g4_sirt_gece', {
    day: 4,
    title: 'Batıdaki Duvar',
    draft:
      'Sinyal kaybolur. Batıdan kurşuni bir bulut duvarı yaklaşıyor; Deniz fırtına basmadan eve iner (~1,5 saat, away). Cliffhanger: kapıyı kapatırken ilk kar taneleri yatay gelmeye başlar: "ikinci perde başlıyor galiba". sleepUntil 08:00.',
    next: 'g5_sabah',
    chapterEnd: 'Gün 4 sonu: batıdan gelen ikinci fırtına',
  }),
];

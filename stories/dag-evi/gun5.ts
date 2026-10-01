/**
 * Gün 5 — "İkinci Dalga" (İSKELET)
 *
 * Fırtına geri gelir. Dallar iki mekanda toplanır:
 *   dağ evi (A ve C; C dün akşam eve indi)  → g5_ev_firtina (çatı Gün 2’de boşlandıysa çöker)
 *   çoban kulübesi (B)                      → g5_kulube (Ozan’a ulaşma şansı)
 * Sonra hepsi g5_pil → g5_beden’de BİRLEŞİR: enfeksiyon / hipotermi bedelleri → g5_gece.
 */
import type { StoryNode } from '@/engine/types';

import { choice, draft, fx, is, node } from './kit';

export const gun5: StoryNode[] = [
  draft(
    'g5_sabah',
    5,
    'İkinci Dalga',
    'Sabah ~08:00 ama dışarısı akşam gibi karanlık; fırtına geri geldi. Deniz bir saattir uyanık, sesi kısık. Mekana göre yönlendirme: rota_asagi → kulübe, diğerleri → dağ evi.',
    {
      next: [{ if: is.flag('rota_asagi'), to: 'g5_kulube' }, { to: 'g5_ev_firtina' }],
    },
  ),
  draft(
    'g5_ev_firtina',
    5,
    'Taş Duvarlar',
    'Rüzgar kapıyı zorluyor, soba borusu uğulduyor. Gün 2’de çatı boşlandıysa (g2_cati_birak ziyareti) öğleye doğru kiriş çatırdar ve bir köşe çöker. Gerilim ~10 dk kesintisiz akış.',
    {
      next: [{ if: is.visited('g2_cati_birak'), to: 'g5_cati_coker' }, { to: 'g5_pil' }],
    },
  ),
  draft(
    'g5_cati_coker',
    5,
    'Çöken Köşe',
    'Çatının bir köşesi karla birlikte içeri iner; odunların yarısı ıslanır, içeri kar savrulur. Deniz yara almaz ama paniktedir. Sobanın yanındaki kuru odunu kurtarmak eller ister.',
    {
      choices: [
        choice('Kuru odunu sobanın dibine çek, kurtar', 'g5_pil', {
          id: 'g5_odun_kurtar',
          requires: is.not(is.injury('yanik_sag_el')),
          lockedReason: 'Elin yanık; ağır kütükleri taşıyamazsın.',
          effects: [fx.stat('isi', +3), fx.stat('saglik', -3)],
        }),
        choice('Masayı devir, sobanın yanına sığınak kur', 'g5_pil', {
          id: 'g5_siginak_kur',
          effects: [fx.stat('isi', -5), fx.stat('moral', +3)],
        }),
      ],
    },
  ),
  draft(
    'g5_kulube',
    5,
    'Fırtınada Kulübe',
    'Kulübenin kapısı kar tutmuş; dün geceki ses/ışık batı kayalıklarından geliyordu. Fırtınada çıkmak ölümcül olabilir ama Ozan oradaysa bir gece daha dayanamayabilir. İple inmek yanık eli kilitler; dışarıda geçen süre ~20 dk.',
    {
      choices: [
        choice('İpe bağlanıp sesin geldiği yere in', 'g5_ozan_kaya', {
          id: 'g5_ozana_in',
          requires: is.not(is.injury('yanik_sag_el')),
          lockedReason: 'Elin yanık; ipe tutunamazsın.',
          effects: [fx.stat('isi', -8)],
        }),
        choice('Fırtınada çıkma, düdükle seslen', 'g5_pil', {
          id: 'g5_kulube_duduk',
          effects: [fx.set('ozan_izi'), fx.stat('moral', -2)],
        }),
        choice('Kapıyı sağlamlaştır, fırtınanın dinmesini bekle', 'g5_pil', {
          id: 'g5_kulube_bekle',
          effects: [fx.stat('isi', +2), fx.stat('moral', -4)],
        }),
      ],
    },
  ),
  draft(
    'g5_ozan_kaya',
    5,
    'Kaya Oyuğu',
    'Kaya oyuğunda Ozan: sağ, bacağı kırık, dudakları mor, konuşurken kelimeleri yutuyor (beden detayı yok). Deniz ağlayıp güler. Onu kulübeye taşımak ayak ister; burada kar duvarı örüp yanında kalmak ise uzun soğuk demek (donmuş parmaklar riski).',
    {
      choices: [
        choice('Onu sırtla, kulübeye taşı', 'g5_pil', {
          id: 'g5_ozan_tasi',
          requires: is.not(is.injury('burkulmus_ayak')),
          lockedReason: 'Ayağın burkuk; ikinizi birden taşıyamaz.',
          effects: [fx.set('ozan_bulundu'), fx.stat('saglik', -8), fx.stat('moral', +10)],
        }),
        choice('Yanında kal, girişe kar duvarı ör', 'g5_pil', {
          id: 'g5_ozan_kal',
          effects: [fx.set('ozan_bulundu'), fx.injure('donmus_parmaklar'), fx.stat('isi', -8), fx.stat('moral', +8)],
        }),
      ],
    },
  ),
  draft(
    'g5_pil',
    5,
    'Yüzde Dokuz',
    'BİRLEŞME NOKTASI. Ekranda pil uyarısı; Deniz ilk kez gerçekten korkar: "telefon ölürse sen de ölürsün gibi geliyor". Telefonu kapatmak (away until 20:00) ya da açık tutmak. Powerbank varsa sobanın yanında ısıtıp son damlasını almak.',
    {
      choices: [
        choice('Kapat, sadece akşam 8’de aç', 'g5_beden', {
          id: 'g5_pil_kapat',
          effects: [fx.set('pil_tasarrufu'), fx.stat('moral', -3)],
        }),
        choice('Açık kalsın, yalnız kalma', 'g5_beden', {
          id: 'g5_pil_acik',
          effects: [fx.unset('pil_tasarrufu'), fx.stat('pil', -8), fx.stat('moral', +5)],
        }),
        choice('Powerbank’ı ısıt, son gücünü al', 'g5_beden', {
          id: 'g5_powerbank',
          visibleIf: is.item('powerbank'),
          effects: [fx.take('powerbank'), fx.stat('pil', +8)],
        }),
      ],
    },
  ),
  draft(
    'g5_beden',
    5,
    'Bedel',
    'Akşam oturumu. Günlerin bedeli gelir: enfeksiyon varsa ateş yükselir; ıslak kıyafet + düşük ısı (isi ≤ 25) ya da hipotermi başlangıcı varsa titreme ve dalgınlık. Hiçbiri yoksa doğrudan gece.',
    {
      next: [
        { if: is.injury('enfeksiyon'), to: 'g5_ates' },
        {
          if: is.any(is.injury('hipotermi_baslangici'), is.all(is.flag('islak_kiyafet'), is.stat('isi', { lte: 25 }))),
          to: 'g5_titreme',
        },
        { to: 'g5_gece' },
      ],
    },
  ),
  draft(
    'g5_ates',
    5,
    'Yükselen Ateş',
    'Deniz’in mesajları kısalır, yazım hataları artar, aynı şeyi iki kez sorar. Dinlenmek ve sıvı almak doğru; yarayı kar ile soğutmak yanlış (sağlık düşer).',
    {
      choices: [
        choice('Bol su iç, uzan, ben buradayım', 'g5_gece', {
          id: 'g5_ates_dinlen',
          effects: [fx.stat('saglik', +4), fx.stat('moral', +4)],
        }),
        choice('Yaraya kar bas, ateşi düşürür', 'g5_gece', {
          id: 'g5_ates_kar',
          effects: [fx.stat('saglik', -12), fx.stat('isi', -5)],
        }),
      ],
    },
  ),
  draft(
    'g5_titreme',
    5,
    'Titreme',
    'Deniz durmadan titriyor, cümleleri yarım kalıyor. Doğru: ıslakları çıkarıp kuru katmanlara ve uyku tulumuna girmek, sıcak içecek. Yanlış: dışarıda hareket edip ısınmaya çalışmak (hipotermi başlar).',
    {
      choices: [
        choice('Islakları çıkar, kuru ne varsa giy, tuluma gir', 'g5_gece', {
          id: 'g5_titreme_kurulan',
          effects: [fx.unset('islak_kiyafet'), fx.set('kuru_kiyafet'), fx.stat('isi', +12)],
        }),
        choice('Kalk, kapının önünde koş, ısınırsın', 'g5_gece', {
          id: 'g5_titreme_kos',
          effects: [fx.injure('hipotermi_baslangici'), fx.stat('isi', -6), fx.stat('saglik', -10)],
        }),
      ],
    },
  ),
  node('g5_gece', {
    day: 5,
    title: 'Uğultu mu, Pervane mi',
    draft:
      'Fırtına gece yarısına doğru diner, yıldızlar çıkar. Deniz uykuya dalarken (sleepUntil 08:00) son mesajı: "frekans. duyuyor musun bunu. rüzgar mı bu yoksa…" ve bağlantı kopar.',
    next: 'g6_sabah',
    chapterEnd: 'Gün 5 sonu: dinen fırtınanın içinden bir uğultu',
  }),
];

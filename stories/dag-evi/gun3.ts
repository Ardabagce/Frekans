/**
 * Gün 3 — "Yol Ayrımı" (İSKELET)
 *
 * Sabah: (yanık + pansuman yoksa) ateş ve enfeksiyon kararı → hava açılır → ANA DAL:
 *   (A) g3_evde   evde kal, SOS işareti        → rota_evde_kal, sos_isareti
 *   (B) g3_asagi  dere yatağından in           → rota_asagi (burkulmuş ayak kilitler)
 *   (C) g3_yukari sinyal için sırta çık        → rota_yukari (yanık el ip seçeneklerini kilitler)
 * Her dal kendi gece düğümüyle (chapterEnd) biter ve g4_sabah yönlendiricisine bağlanır.
 */
import type { StoryNode } from '@/engine/types';

import { choice, draft, fx, is, node } from './kit';

export const gun3: StoryNode[] = [
  draft(
    'g3_sabah',
    3,
    'Yol Ayrımı',
    'Sabah ~08:00. Gece rüzgar dinmiş; Deniz kötü uyumuştur. Yanık pansumansız kaldıysa (yanik_sag_el, yanik_pansuman yok) el şişmiş, ateş var: önce ona bakılır.',
    {
      next: [
        { if: is.all(is.injury('yanik_sag_el'), is.not(is.flag('yanik_pansuman'))), to: 'g3_ates' },
        { to: 'g3_hava' },
      ],
    },
  ),
  draft(
    'g3_ates',
    3,
    'Ateş',
    'Yanığın çevresi kızarmış, sıcak; Deniz titriyor ama "herhalde sobadandır" diye geçiştirir. Geç de olsa temizleyip sarmak enfeksiyonu önler ama sağlığa mal olur; dokunmamak enfeksiyon yarasını kalıcı yapar.',
    {
      choices: [
        choice('Yarayı aç, temizle, yeniden sar', 'g3_hava', {
          id: 'g3_ates_temizle',
          effects: [fx.set('yanik_pansuman'), fx.stat('saglik', -5), fx.stat('moral', +3)],
        }),
        choice('Dokunma, açarsan daha kötü olur', 'g3_hava', {
          id: 'g3_ates_dokunma',
          effects: [fx.injure('enfeksiyon'), fx.stat('saglik', -15)],
        }),
      ],
    },
  ),
  draft(
    'g3_hava',
    3,
    'Açıklık',
    'Bulutlar aralanır, güneş karı yakar. Deniz: "bu açıklık uzun sürmez, şimdi karar vermem lazım". Ana dal seçimi; Deniz oyuncunun dün akşamki fikrine gönderme yapar. Seçim sonrası hazırlık ~5 dk.',
    {
      choices: [
        choice('Evde kal, karın üstüne dev bir SOS yaz', 'g3_evde', { effects: [fx.set('rota_evde_kal')] }),
        choice('Dere yatağından in, Ozan’ın izinden', 'g3_asagi', {
          requires: is.not(is.injury('burkulmus_ayak')),
          lockedReason: 'Ayağın burkuk; bu iniş seni taşımaz.',
          effects: [fx.set('rota_asagi')],
        }),
        choice('Sırta çık, oradan sinyal ara', 'g3_yukari', {
          requires: is.stat('saglik', { gte: 35 }),
          lockedReason: 'Çok halsizsin; sırta çıkacak gücün yok.',
          effects: [fx.set('rota_yukari')],
        }),
      ],
    },
  ),

  // ---- (A) Evde kal ----
  draft(
    'g3_evde',
    3,
    'Kardaki Harfler',
    'Evin önündeki düzlükte (açık, yukarıdan görünür) SOS yazılacak. Nasıl yazılacağı tartışılır; harfler en az 10 adım boyunda olmalı. Görev ~10 dk (away 10m), dönüşte parmaklar uyuşmuş.',
    {
      choices: [
        choice('Karı çiğneyerek kocaman harfler yap', 'g3_isaret_yap', {
          id: 'g3_isaret_cigne',
          effects: [fx.set('sos_isareti'), fx.stat('isi', -5)],
        }),
        choice('Koyu dalları kırıp harfleri onlarla diz', 'g3_isaret_yap', {
          id: 'g3_isaret_dal',
          requires: is.not(is.injury('yanik_sag_el')),
          lockedReason: 'Elin yanık; dal kıramazsın.',
          effects: [fx.set('sos_isareti'), fx.stat('isi', -3), fx.stat('moral', +3)],
        }),
      ],
    },
  ),
  draft(
    'g3_isaret_yap',
    3,
    'S O S',
    'Deniz harfleri bitirir, pencereden fotoğrafını atar ("bu benim en kısa metnim ve en önemlisi"). Öğleden sonra bekleyiş: hiçbir ses yok. Akşamüstü pil tasarrufu arası (17:00 öncesiyse away until 20:00).',
    {
      choices: [
        choice('Çok iyi olmuş, yukarıdan kesin görünür', 'g3_evde_gece', { id: 'g3_isaret_ovgu', effects: [fx.stat('moral', +5)] }),
        choice('Harfleri biraz daha derinleştir', 'g3_evde_gece', { id: 'g3_isaret_derin', effects: [fx.stat('isi', -4)] }),
      ],
    },
  ),
  node('g3_evde_gece', {
    day: 3,
    title: 'Uğultu',
    draft:
      'Gece, iyi geceler derken vadinin yukarısından tok bir uğultu gelir: ikinci bir çığ mı, gök gürültüsü mü? Ev sarsılmaz ama Deniz harflerin kar altında kalıp kalmadığını sabah görebilecek. sleepUntil 08:00.',
    next: 'g4_sabah',
    chapterEnd: 'Gün 3 sonu: vadinin yukarısından gelen uğultu',
  }),

  // ---- (B) Aşağı in ----
  draft(
    'g3_asagi',
    3,
    'İniş Hazırlığı',
    'Deniz çantayı hazırlar (ip, kalan yemek, termos varsa). Rota tartışılır: haritadaki yaz patikası, dere yatağı ya da Ozan’ın izleri. Haritası yandıysa (harita_yakildi) patika seçeneği kilitli. Yola çıkış ~10 dk sonra.',
    {
      choices: [
        choice('Haritadaki yaz patikasını izle', 'g3_dere', {
          id: 'g3_rota_harita',
          requires: is.not(is.flag('harita_yakildi')),
          lockedReason: 'Haritan yok; sobada yandı.',
          effects: [fx.stat('moral', +3)],
        }),
        choice('Dere yatağını takip et, su hep aşağı akar', 'g3_dere', { id: 'g3_rota_dere', effects: [fx.stat('isi', -3)] }),
        choice('Ozan’ın batonunu bulduğun yerden başla', 'g3_dere', {
          id: 'g3_rota_baton',
          requires: is.flag('ozan_izi'),
          lockedReason: 'Ozan’dan henüz hiçbir iz bulmadınız.',
          effects: [fx.stat('moral', +2)],
        }),
      ],
    },
  ),
  draft(
    'g3_dere',
    3,
    'Buzlu Geçit',
    'Bir saatlik inişten sonra (away ~1h) dere, çığ molozunun altından çıkıp önünü keser. Taşlar buzlu, su hızlı. Geçiş yolu Deniz’in güvenine ve eline bağlı. Aceleyle inmek ayak burkar; buzda atlarken kafa lambası suya düşer.',
    {
      choices: [
        choice('Buzlu taşlardan atla, hızlı geç', 'g3_kulube', {
          id: 'g3_gecis_atla',
          requires: is.stat('moral', { gte: 55 }),
          lockedReason: 'Deniz sana henüz bu kadar güvenmiyor.',
          effects: [fx.set('fener_kayboldu'), fx.take('kafa_lambasi'), fx.stat('isi', -6)],
        }),
        choice('İpi ağaca bağla, tutunarak geç', 'g3_kulube', {
          id: 'g3_gecis_ip',
          requires: is.not(is.injury('yanik_sag_el')),
          lockedReason: 'Elin yanık, ipi tutamazsın.',
          effects: [fx.stat('moral', +3)],
        }),
        choice('Kardan köprü ara, yukarıdan dolaş', 'g3_kulube', {
          id: 'g3_gecis_dolas',
          effects: [fx.stat('pil', -3), fx.stat('isi', -4)],
        }),
        choice('Hava kararmadan koşarak in', 'g3_kulube', {
          id: 'g3_gecis_kos',
          effects: [fx.injure('burkulmus_ayak'), fx.stat('saglik', -8)],
        }),
      ],
    },
  ),
  node('g3_kulube', {
    day: 3,
    title: 'Çoban Kulübesi',
    draft:
      'Hava kararırken yarı yolda terk edilmiş bir çoban kulübesine varır: ocak, kuru ot, kapı menteşesinden sarkıyor. Gece cliffhanger: kapının üstüne bıçakla kazınmış bir ok; tahta tozu taze. sleepUntil 08:00.',
    next: 'g4_sabah',
    chapterEnd: 'Gün 3 sonu: kulübe kapısında taze kazınmış bir ok',
  }),

  // ---- (C) Yukarı çık ----
  draft(
    'g3_yukari',
    3,
    'Sırt Yolu',
    'Sırt evin 300 metre yukarısında. İki yol: kısa ama dik kayalık (ip gerekir) ya da uzun, rüzgara açık yumuşak sırt. Yanık el ipli yolu kilitler. Tırmanış görevi ~10 dk + yarım günlük yürüyüş özeti.',
    {
      choices: [
        choice('İpi beline bağla, kayalıktan çık', 'g3_sirt_yolu', {
          id: 'g3_yol_kayalik',
          requires: is.not(is.injury('yanik_sag_el')),
          lockedReason: 'Elin yanık; ipe tutunamazsın.',
          effects: [fx.stat('saglik', -3)],
        }),
        choice('Uzun ama yumuşak sırttan dolaş', 'g3_sirt_yolu', {
          id: 'g3_yol_uzun',
          effects: [fx.stat('isi', -6), fx.stat('pil', -2)],
        }),
      ],
    },
  ),
  draft(
    'g3_sirt_yolu',
    3,
    'Kaya Sığınağı',
    'Zirveye bir saat kala hava kararmaya başlar. Bir kaya çıkıntısının altında rüzgarsız bir kovuk bulur. Burada gecelemek sabah zirveye yakın olmak demek ama soğuk; eve dönmek güvenli ama yarın yeniden tırmanmak gerek. Islak kıyafetle (islak_kiyafet) soğuk gece Gün 5’te hipotermi riskini büyütür.',
    {
      choices: [
        choice('Sığınakta kal, sabah zirveye çık', 'g3_kaya_siginagi', {
          effects: [fx.stat('isi', -10), fx.stat('moral', +2)],
        }),
        choice('Eve dön, yarın yeniden dene', 'g3_eve_donus', { effects: [fx.stat('pil', -3), fx.stat('saglik', -3)] }),
      ],
    },
  ),
  node('g3_kaya_siginagi', {
    day: 3,
    title: 'Kovuktaki Gece',
    draft:
      'Kaya kovuğunda dizlerini göğsüne çekmiş, telefonun ışığında konuşur; ıslak kıyafetle kaldıysa (islak_kiyafet) titreme başlar (Gün 5 hipotermi kontrolü). Cliffhanger: gece yarısı telefon bir anlığına tek çubuk gösterir ve gelmeyen bir bildirimin sesi çalar. sleepUntil 08:00.',
    next: 'g4_sabah',
    chapterEnd: 'Gün 3 sonu: kovukta bir anlık sinyal',
  }),
  node('g3_eve_donus', {
    day: 3,
    title: 'Geri Dönüş',
    draft:
      'Yorgun ama sağ salim eve döner, soba yeniden yakılır. Cliffhanger: pencereden sırtı izlerken tam zirvede, kendi gidemediği yerde, bir an bir ışık parlar. sleepUntil 08:00.',
    next: 'g4_sabah',
    chapterEnd: 'Gün 3 sonu: sırtta parlayan ışık',
  }),
];

/**
 * Gün 6 — "Pervane Sesi" (İSKELET)
 *
 * Sabah: Ozan’ın akıbeti netleşir (yanında / iz var / hiç haber yok).
 * Öğleden sonra: helikopter sesi. İşaret doğru yerdeyse (sos_isareti, isaret_yanlis_yer değil)
 * ya da ekiple temas varsa görülür (helikopter_goruldu); yoksa geçip gider.
 * Gece: kapıya yine bir şey vurur (Gün 1’e geri çağrı).
 */
import type { StoryNode } from '@/engine/types';

import { choice, draft, fx, is, node } from './kit';

export const gun6: StoryNode[] = [
  draft(
    'g6_sabah',
    6,
    'Pervane Sesi',
    'Sabah ~08:00, gökyüzü cam gibi açık ve dondurucu. Önce Ozan: yanındaysa (ozan_bulundu) onunla, izi varsa (ozan_izi) arama kararıyla, hiçbir şey yoksa yasa yakın bir sessizlikle başlar.',
    {
      next: [
        { if: is.flag('ozan_bulundu'), to: 'g6_ozan_yaninda' },
        { if: is.flag('ozan_izi'), to: 'g6_ozan_iz' },
        { to: 'g6_ozan_yok' },
      ],
    },
  ),
  draft(
    'g6_ozan_yaninda',
    6,
    'İki Kişilik Soğuk',
    'Ozan Deniz’in yanında, ateşli ve halsiz ama şaka yapacak kadar kendinde. Deniz oyuncuyu Ozan’a anlatır ("bu Frekans, beni o tuttu"). Son yiyecek paylaşılır.',
    {
      choices: [
        choice('Son konserveyi Ozan’a ver', 'g6_pervane', {
          id: 'g6_yemek_ozan',
          effects: [fx.stat('saglik', -4), fx.stat('moral', +5)],
        }),
        choice('Yarı yarıya paylaşın', 'g6_pervane', { id: 'g6_yemek_paylas', effects: [fx.stat('saglik', +2)] }),
      ],
    },
  ),
  draft(
    'g6_ozan_iz',
    6,
    'Son İz',
    'Elde Ozan’a dair izler var (ışık, not, düdük, sesli mesaj). Fırtına sonrası tek açık gün: 2 saatlik bir arama (away 2h) ya da işaretin başında kalmak. Arama sağlık ve sağlam ayak ister.',
    {
      choices: [
        choice('İzleri takip et, onu bul', 'g6_ozan_bulma', {
          id: 'g6_ozan_ara',
          requires: is.all(is.not(is.injury('burkulmus_ayak')), is.stat('saglik', { gte: 30 })),
          lockedReason: 'Bu halde iki saat karda yürüyemezsin.',
          effects: [fx.stat('isi', -6)],
        }),
        choice('İşaretin başında kal, yardım gelsin', 'g6_pervane', { id: 'g6_ozan_bekle', effects: [fx.stat('moral', -3)] }),
      ],
    },
  ),
  draft(
    'g6_ozan_bulma',
    6,
    'Kaya Nişi',
    'İki saatlik aramanın sonunda bir kaya nişinde Ozan: sağ ama yürüyemiyor. Deniz’in ilk mesajı tek kelime: "buldum". Onu eve/kulübeye kadar destekleyerek getirmek eller ister; yanında kalmak işaretten uzak kalmak demek.',
    {
      choices: [
        choice('Koluna gir, birlikte geri dönün', 'g6_pervane', {
          id: 'g6_ozan_getir',
          requires: is.not(is.injury('yanik_sag_el')),
          lockedReason: 'Elin yanık; onu tutup taşıyamazsın.',
          effects: [fx.set('ozan_bulundu'), fx.stat('saglik', -6), fx.stat('moral', +10)],
        }),
        choice('Yanında kal, onu ısıt', 'g6_pervane', {
          id: 'g6_ozan_isit',
          effects: [fx.set('ozan_bulundu'), fx.stat('isi', -8), fx.stat('moral', +8)],
        }),
      ],
    },
  ),
  draft(
    'g6_ozan_yok',
    6,
    'Sessizlik',
    'Ozan’dan hiçbir iz yok. Deniz espri yapmayı bırakır; kısa, düz cümleler. Oyuncunun tavrı moral belirler.',
    {
      choices: [
        choice('Ozan güçlü, bir yerde dayanıyordur', 'g6_pervane', { id: 'g6_umut', effects: [fx.stat('moral', +5)] }),
        choice('Şimdi kendine odaklan, onu sonra düşün', 'g6_pervane', { id: 'g6_odak', effects: [fx.stat('saglik', +3)] }),
      ],
    },
  ),
  draft(
    'g6_pervane',
    6,
    'Pervane',
    'Öğleden sonra vadinin dibinden pervane sesi yükselir. Deniz panikle nasıl işaret vereceğini sorar; karar saniyeler içinde verilmeli, mesajlar kesik kesik. Telefon flaşı pil yer; kollarını sallamak ve duman, yerdeki işarete güvenmek demek.',
    {
      choices: [
        choice('Telefonun flaşıyla yak söndür', 'g6_goruldu', {
          id: 'g6_flas',
          requires: is.stat('pil', { gte: 15 }),
          lockedReason: 'Pil buna yetmez.',
          effects: [fx.stat('pil', -10)],
        }),
        choice('Dışarı çık, kollarını salla', 'g6_isaret_kontrol', { id: 'g6_kol_salla', effects: [fx.stat('isi', -5)] }),
        choice('Ateşe yaş dal at, duman çıkar', 'g6_isaret_kontrol', { id: 'g6_duman', effects: [fx.stat('isi', -2)] }),
      ],
    },
  ),
  draft(
    'g6_isaret_kontrol',
    6,
    'Görüyorlar mı',
    'Helikopter iki kez vadinin üstünden geçer. Görülme durumu işarete bağlı: açıkta, doğru yerde bir SOS (sos_isareti ve isaret_yanlis_yer değil) ya da daha önce iletilmiş konum (ekip_temas) → görülür; yoksa geçip gider.',
    {
      next: [
        { if: is.all(is.flag('sos_isareti'), is.not(is.flag('isaret_yanlis_yer'))), to: 'g6_goruldu' },
        { if: is.flag('ekip_temas'), to: 'g6_goruldu' },
        { to: 'g6_kacti' },
      ],
    },
  ),
  draft(
    'g6_goruldu',
    6,
    'Gördüler',
    'Helikopter alçalır, kanat sallar; rüzgar yüzünden inemez ama battaniye, kimyasal ısıtıcı ve bir not içeren bir paket bırakır: "yarın sabah kara ekibi geliyor". Deniz ağlar, güler, yazamaz.',
    {
      choices: [
        choice('Gördüler! Bu gece sadece dayan', 'g6_gece', {
          id: 'g6_goruldu_dayan',
          effects: [fx.set('helikopter_goruldu'), fx.stat('moral', +10), fx.stat('isi', +5)],
        }),
        choice('Paketteki battaniyeye hemen sarın', 'g6_gece', {
          id: 'g6_goruldu_battaniye',
          effects: [fx.set('helikopter_goruldu'), fx.stat('isi', +10)],
        }),
      ],
    },
  ),
  draft(
    'g6_kacti',
    6,
    'Geçip Gitti',
    'Pervane sesi uzaklaşır. İşaret ağaçların altındaysa (isaret_yanlis_yer) Deniz bunu fark eder ve sessizleşir. Ertesi gün için iki yol: işareti düzeltip beklemek ya da kendi başına inmeye karar vermek.',
    {
      choices: [
        choice('Yarın yine gelirler; işareti açığa taşı', 'g6_gece', {
          id: 'g6_isaret_tasi',
          effects: [fx.set('sos_isareti'), fx.unset('isaret_yanlis_yer'), fx.stat('isi', -6), fx.stat('moral', -2)],
        }),
        choice('Beklemek yok, yarın kendin in', 'g6_gece', {
          id: 'g6_inis_karari',
          requires: is.not(is.injury('burkulmus_ayak')),
          lockedReason: 'Ayağın burkuk; inişi yürüyemezsin.',
          effects: [fx.set('rota_asagi'), fx.stat('moral', -4)],
        }),
        choice('Bu gece sadece konuşalım', 'g6_gece', { id: 'g6_konus', effects: [fx.stat('moral', +6)] }),
      ],
    },
  ),
  node('g6_gece', {
    day: 6,
    title: 'Yine Kapı',
    draft:
      'Gece Deniz uyumadan önce oyuncuyla uzun konuşur: kurtulunca ilk iş seninle çay içeceğim. Pil tek haneli. Cliffhanger (Gün 1’e geri çağrı): "biri kapıya vurdu. yine." Telefon kapanır. sleepUntil 08:00.',
    next: 'g7_sabah',
    chapterEnd: 'Gün 6 sonu: kapıya yine bir şey vurdu',
  }),
];

/**
 * Gün 7 — "Son Mesaj" (İSKELET)
 *
 * g7_sabah: helikopter gördüyse ya da ekiple temas varsa → kara ekibi (g7_ekip → g7_tahliye).
 * Yoksa → g7_yalniz: sağlık kritikse son gece (g7_son_gece → g7_safak), değilse son karar:
 *   in (g7_inis) / son pille sırta çık (g7_sirt_son) / işaretin başında bekle (g7_bekleyis).
 * g7_tahliye son yönlendirici: tam_kurtulus → kalici_hasar → yalniz_inis.
 */
import type { StoryNode } from '@/engine/types';

import { choice, draft, fx, is } from './kit';

/** Kalıcı iz bırakan yaralar (pansumanlı yanık hariç) */
const kaliciYaraYok = is.all(
  is.not(is.injury('donmus_parmaklar')),
  is.not(is.injury('enfeksiyon')),
  is.not(is.injury('hipotermi_baslangici')),
  is.not(is.all(is.injury('yanik_sag_el'), is.not(is.flag('yanik_pansuman')))),
);

export const gun7: StoryNode[] = [
  draft(
    'g7_sabah',
    7,
    'Son Mesaj',
    'Sabah ~08:00. Dün gece kapıya vuran neydi? Helikopter gördüyse ya da konum iletildiyse (helikopter_goruldu / ekip_temas) kapıdaki kara ekibidir; değilse yine rüzgar ve Deniz yalnız.',
    {
      next: [
        { if: is.any(is.flag('helikopter_goruldu'), is.flag('ekip_temas')), to: 'g7_ekip' },
        { to: 'g7_yalniz' },
      ],
    },
  ),

  // ---- Kurtarma yolu ----
  draft(
    'g7_ekip',
    7,
    'Kapıdakiler',
    'Kapıda turuncu montlu üç kişi (isimsiz, "ekip"). Deniz oyuncuya canlı anlatır: "biri bana çay uzatıyor, ağlıyorum". Ekip Ozan’ı sorar; Deniz’in bildikleri aramayı belirler. Ekip telsizle haber verirken ~30 dk bekleyiş.',
    {
      choices: [
        choice('Ozan seninle, önce onu alsınlar', 'g7_tahliye', {
          id: 'g7_ozan_once',
          visibleIf: is.flag('ozan_bulundu'),
          effects: [fx.stat('moral', +5)],
        }),
        choice('Ozan’ın izlerini ekibe anlat', 'g7_tahliye', {
          id: 'g7_iz_anlat',
          requires: is.flag('ozan_izi'),
          lockedReason: 'Ozan’dan hiçbir iz bulamadınız.',
          effects: [fx.set('ozan_bulundu')],
        }),
        choice('Önce seni indirsinler, Ozan’ı onlar arar', 'g7_tahliye', { id: 'g7_once_sen' }),
      ],
    },
  ),
  draft(
    'g7_tahliye',
    7,
    'Tahliye',
    'Deniz sedyeyle ya da yürüyerek aşağı indirilir (~2 saat, ara ara mesaj). Son yönlendirme: Ozan bulunduysa ve kalıcı yara yoksa tam kurtuluş; kalıcı yara (donmuş parmak, enfeksiyon, hipotermi, pansumansız yanık) varsa kalıcı hasar; Ozan’dan haber yoksa yalnız iniş.',
    {
      next: [
        { if: is.all(is.flag('ozan_bulundu'), kaliciYaraYok), to: 'son_tam_kurtulus' },
        {
          if: is.any(
            is.injury('donmus_parmaklar'),
            is.injury('enfeksiyon'),
            is.injury('hipotermi_baslangici'),
            is.injury('yanik_sag_el'),
          ),
          to: 'son_kalici_hasar',
        },
        { to: 'son_yalniz_inis' },
      ],
    },
  ),

  // ---- Yalnız yol ----
  draft(
    'g7_yalniz',
    7,
    'Kimse Gelmedi',
    'Kapıda kimse yok, sadece rüzgarın devirdiği kova. Pil tek haneli. Sağlık kritikse (saglik ≤ 25) Deniz yataktan kalkamaz; değilse son kararı verir.',
    {
      next: [{ if: is.stat('saglik', { lte: 25 }), to: 'g7_son_gece' }, { to: 'g7_karar' }],
    },
  ),
  draft(
    'g7_karar',
    7,
    'Son Karar',
    'Deniz son kez soruyor: "ne yapayım frekans. ne dersen onu yapacağım". İnmek 5–6 saatlik yürüyüş (away, ara ara tek kelimelik mesaj); sırt son pili yer; beklemek işarete ve kayda güvenmek.',
    {
      choices: [
        choice('In. Bugün, hava açıkken', 'g7_inis', {
          id: 'g7_in',
          requires: is.not(is.injury('burkulmus_ayak')),
          lockedReason: 'Ayağın burkuk; bu inişi yürüyemezsin.',
          effects: [fx.set('rota_asagi'), fx.stat('isi', -5)],
        }),
        choice('Son pille sırta çık, sinyal ara', 'g7_sirt_son', {
          id: 'g7_sirt',
          requires: is.stat('pil', { gte: 8 }),
          lockedReason: 'Pil bitmek üzere; sırta varmadan kapanır.',
          effects: [fx.stat('pil', -5), fx.stat('isi', -6)],
        }),
        choice('Kal, işaretin başında bekle', 'g7_bekleyis', { id: 'g7_bekle', effects: [fx.set('pil_tasarrufu')] }),
      ],
    },
  ),
  draft(
    'g7_inis',
    7,
    'Uzun İniş',
    'Deniz dere yatağından tek başına iner (5–6 saat). Mesajlar giderek seyrekleşir. Sağlık çok düştüyse (saglik ≤ 30) yolda durur (ölüm sonu, ölçülü); pil biterse sinyal kesilir (kötü son); yoksa akşamüstü köyün ilk evlerine varır.',
    {
      next: [
        { if: is.stat('saglik', { lte: 30 }), to: 'son_olum' },
        { if: is.stat('pil', { lte: 4 }), to: 'son_kotu' },
        { to: 'son_yalniz_inis' },
      ],
    },
  ),
  draft(
    'g7_sirt_son',
    7,
    'Son Çubuk',
    'Son pille sırta tırmanış (~1 saat). Zirvede sinyal: konum gider, ekip yola çıkar. Ama pil çok azsa (pil ≤ 12) telefon konum gitmeden kapanır ve Deniz’den bir daha haber gelmez.',
    {
      next: [{ if: is.stat('pil', { lte: 12 }), to: 'son_kotu' }, { to: 'g7_tahliye' }],
    },
  ),
  draft(
    'g7_bekleyis',
    7,
    'Bekleyiş',
    'Deniz işaretin başında, telefonu kapalı, saatte bir açarak bekler (away 1h aralar). Sağlık kritikse (saglik ≤ 30) sessizce uykuya dalar (ölüm sonu). İşaret doğru yerdeyse öğleden sonra ikinci uçuş görür; yoksa telefon son kez kapanır.',
    {
      next: [
        { if: is.stat('saglik', { lte: 30 }), to: 'son_olum' },
        { if: is.all(is.flag('sos_isareti'), is.not(is.flag('isaret_yanlis_yer'))), to: 'g7_tahliye' },
        { to: 'son_kotu' },
      ],
    },
  ),
  draft(
    'g7_son_gece',
    7,
    'Son Gece',
    'Deniz çok zayıf, ateşli ya da üşümüş; mesajlar tek kelime. Oyuncu ona uyanık kalması için eşlik eder. Sobayı canlandırmak kibrit ister. Ölçülü, sıcak bir sahne.',
    {
      choices: [
        choice('Benimle konuş, sakın uyuma', 'g7_safak', { id: 'g7_konus', effects: [fx.stat('moral', +10)] }),
        choice('Sobaya ne varsa at, ısın', 'g7_safak', {
          id: 'g7_soba',
          requires: is.not(is.flag('kibrit_bitti')),
          lockedReason: 'Kibrit kalmadı; soba söndü.',
          effects: [fx.stat('isi', +12)],
        }),
      ],
    },
  ),
  draft(
    'g7_safak',
    7,
    'Şafak',
    'Şafak söker. Gece ısı korunduysa (isi ≥ 25) ve 112 kaydı varsa, fırtına sonrası kaydı izleyen kara ekibi kapıya gelir; yoksa Deniz son bir sesli mesaj bırakır.',
    {
      next: [
        { if: is.all(is.stat('isi', { gte: 25 }), is.flag('kayit_112')), to: 'g7_tahliye' },
        { to: 'son_olum' },
      ],
    },
  ),
];

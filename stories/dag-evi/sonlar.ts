/**
 * Hikaye sonları (İLK TASLAK — gerçek adımlar).
 * Kural 3: kötü sonlar ölçülü; kan, vahşet, beden detayı yok. Ölüm bir sessizlikle anlatılır.
 * Nasıl ulaşılır: gun7.ts (g7_tahliye, g7_inis, g7_sirt_son, g7_bekleyis, g7_safak).
 */
import type { EndingDef, StoryNode } from '@/engine/types';

import { is, node, pause, photo, say, system, voice } from './kit';

export const ENDINGS: Record<string, EndingDef> = {
  tam_kurtulus: {
    kind: 'iyi',
    title: 'Tam Kurtuluş',
    summary: 'Deniz ve Ozan helikopterle indirildi. Kalıcı bir iz yok; geriye bir çay sözü kaldı.',
  },
  kalici_hasar: {
    kind: 'kismi',
    title: 'Kalıcı İz',
    summary: 'Deniz kurtarıldı ama dağ yanına bir iz bıraktı: yanık, donmuş parmaklar ya da uzun bir iyileşme.',
  },
  yalniz_inis: {
    kind: 'kismi',
    title: 'Yalnız İniş',
    summary: 'Deniz aşağıya, köye sağ salim ulaştı. Ozan’dan ise henüz haber yok.',
  },
  kotu_son: {
    kind: 'kotu',
    title: 'Sinyal Kesildi',
    summary: 'Son pil de bitti. Deniz’den bir daha haber gelmedi; akıbeti bilinmiyor.',
  },
  olum: {
    kind: 'olum',
    title: 'Son Mesaj',
    summary: 'Soğuk ve yorgunluk ağır bastı. Deniz son bir sesli mesaj bıraktı, sonra sessizlik.',
  },
};

export const sonlar: StoryNode[] = [
  node('son_tam_kurtulus', {
    day: 7,
    title: 'Tam kurtuluş',
    ending: 'tam_kurtulus',
    steps: [
      say('frekans', { delay: '5s' }),
      say('helikopterdeyiz'),
      say('ozan karşımda. battaniyeye sarmışlar ve hala espri yapıyor, pilot gülüyor'),
      photo('dag-silueti', 'yukardan böyle görünüyormuş'),
      say('yukarıdan*'),
      voice(9, 'duyuyor musun? pervane. bu sefer bizim için dönüyor. ...sen olmasan, ilk gece... neyse. aşağıda konuşuruz.'),
      say('ilk iş seninle çay içeceğim. söz'),
      system('Deniz ve Ozan güvende.'),
    ],
  }),
  node('son_kalici_hasar', {
    day: 7,
    title: 'Kalıcı iz',
    ending: 'kalici_hasar',
    steps: [
      say('hastanedeyim', { delay: '5s' }),
      say('her şey çok sıcak. battaniye bile fazla geliyor'),
      say('doktor parmaklarım için "sabır" dedi. uzun sürecekmiş', { if: is.injury('donmus_parmaklar') }),
      say('elimdeki yanık iz bırakacakmış. olsun, sobayı hatırlatır', { if: is.injury('yanik_sag_el') }),
      say('ateşim düştü ama birkaç gün daha buradayım', {
        if: is.any(is.injury('enfeksiyon'), is.injury('hipotermi_baslangici')),
      }),
      say('ozan iki kat aşağıda. alçılı bacağıyla hemşireleri güldürüyor', { if: is.flag('ozan_bulundu') }),
      say('ozan’dan hala haber yok. arıyorlar, ben de buradan bekliyorum', { if: is.not(is.flag('ozan_bulundu')) }),
      say('bazı şeyler eskisi gibi olmayacak frekans. ama ben buradayım'),
      system('Deniz kurtarıldı. Bazı izler kalıcı.'),
    ],
  }),
  node('son_yalniz_inis', {
    day: 7,
    title: 'Yalnız iniş',
    ending: 'yalniz_inis',
    steps: [
      say('aşağıdayım. köyde', { delay: '5s' }),
      say('bir teyze hiçbir şey sormadan beni sobanın yanına oturttu. elimde çay var frekans. gerçek, sıcak çay'),
      say('ozan’ın yerini ekibe gösterdim. sabah çıkacaklar', { if: is.flag('ozan_bulundu') }),
      say('ozan’ı herkese soruyorum. kimse bir şey bilmiyor', { if: is.not(is.flag('ozan_bulundu')) }),
      voice(7, 'onu orada bıraktım gibi hissediyorum. biliyorum öyle değil. ama öyle hissediyorum.'),
      say('haber gelene kadar bu frekansı kapatma olur mu'),
      system('Deniz güvende. Ozan’dan haber yok.'),
    ],
  }),
  node('son_kotu', {
    day: 7,
    title: 'Sinyal kesildi',
    ending: 'kotu_son',
    steps: [
      say('frekans pil %2'),
      say('bunu yazarken bile azalıyor sanki'),
      say('eğer kesilirse bil ki sen olmasan ilk gece biterdi bu iş'),
      say('sobanın sesi geliyor. sen de duy diye biraz susuyorum'),
      pause('20s'),
      say('iyi geceler frekans'),
      system('Sinyal kesildi', { tone: 'warning', delay: '6s' }),
      system('Deniz’e ulaşılamıyor', { delay: '1m' }),
    ],
  }),
  node('son_olum', {
    day: 7,
    title: 'Son mesaj',
    ending: 'olum',
    steps: [
      say('frekans'),
      say('çok uykum var'),
      say('üşümüyorum artık. garip değil mi'),
      say('sana sesimi bırakıyorum. yazmaya elim gitmiyor'),
      voice(
        12,
        'kar yağıyor yine. pencereden çok güzel görünüyor. ...bana bir şey anlat olur mu, kötü bir film mesela. ben biraz gözlerimi kapatacağım. sadece biraz. ...iyi ki sen çıktın frekans.',
      ),
      system('Deniz’e ulaşılamıyor', { delay: '2m' }),
    ],
  }),
];

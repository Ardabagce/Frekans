/**
 * Gün 2 — "Kapıdaki Ses" (İSKELET)
 *
 * Akış: g2_sabah → kapıdaki ses (çanta / keçi / rüzgar) → envanter (+ pansuman) →
 * odunluk görevi → çatı → akşam: üç yol tartışması → gece uzaktaki ışık (cliffhanger).
 * Tempo: görevler 5–10 dk, öğlen pil arası, gece 08:00'e kadar uyku.
 */
import type { StoryNode } from '@/engine/types';

import { choice, draft, fx, is, node } from './kit';

export const gun2: StoryNode[] = [
  draft(
    'g2_sabah',
    2,
    'Kapıdaki Ses',
    'Sabah ~08:00, Deniz uyanır; gece kapıya vuran sesi hatırlar ve kapıyı açmaya korkar. Soba közde, cam buz tutmuş; oyuncuyla konuşarak cesaret toplar (~3 dk).',
    {
      choices: [
        choice('Önce pencereden bak, sonra aç', 'g2_kapi', { id: 'g2_pencereden_bak', effects: [fx.stat('moral', +3)] }),
        choice('Aç hadi, belki Ozan’dır', 'g2_kapi', { id: 'g2_hemen_ac', effects: [fx.stat('isi', -2)] }),
      ],
    },
  ),
  draft(
    'g2_kapi',
    2,
    'Kapının Önü',
    'Kapı dize kadar karla açılır. Sesin ne olduğu önceki geceye bağlı: Ozan’dan iz bulunduysa (ozan_izi) rüzgarın sürüklediği çantası, gece dışarı çıkıldıysa (disari_cikti_gece) yemlik arayan bir keçi, yoksa sadece rüzgar ve yarı dolmuş tuhaf bir ayak izi.',
    {
      next: [
        { if: is.flag('ozan_izi'), to: 'g2_canta' },
        { if: is.flag('disari_cikti_gece'), to: 'g2_keci' },
        { to: 'g2_ruzgar' },
      ],
    },
  ),
  draft(
    'g2_canta',
    2,
    'Ozan’ın Çantası',
    'Kapının dibinde Ozan’ın buz tutmuş sırt çantası. Deniz sarsılır: rüzgar mı getirdi, Ozan buraya kadar gelip geri mi döndü? İçinde termos ve neredeyse boş bir powerbank olabilir.',
    {
      choices: [
        choice('Çantayı içeri al, neler var bakalım', 'g2_envanter', {
          id: 'g2_canta_ac',
          effects: [fx.give('termos'), fx.give('powerbank'), fx.stat('moral', +3)],
        }),
        choice('Ozan’a seslen, yakında olabilir', 'g2_envanter', {
          id: 'g2_canta_seslen',
          effects: [fx.stat('isi', -3), fx.stat('moral', -2)],
        }),
      ],
    },
  ),
  draft(
    'g2_keci',
    2,
    'Misafir',
    'Saçağın altına sığınmış, sakalı buz tutmuş bir dağ keçisi. Deniz ilk kez gerçekten güler; espri geri gelir. Keçinin geldiği yön (aşağıdaki kulübe) Gün 3 dalları için ipucu.',
    {
      choices: [
        choice('Ona bir isim koy bence', 'g2_envanter', { id: 'g2_keci_isim', effects: [fx.stat('moral', +6)] }),
        choice('Kovala gitsin, yiyeceğine dadanmasın', 'g2_envanter', { id: 'g2_keci_kovala', effects: [fx.stat('moral', +1)] }),
      ],
    },
  ),
  draft(
    'g2_ruzgar',
    2,
    'Sadece Rüzgar',
    'Kimse yok; kopmuş bir kepenk kapıya çarpıyor. Ama eşikte, karla yarı dolmuş tek bir ayak izi var. Deniz bunu mantıkla açıklamaya çalışır, oyuncu ya rahatlatır ya da merakını besler.',
    {
      choices: [
        choice('Kepenk vurmuştur, iz eski olabilir', 'g2_envanter', { id: 'g2_ruzgar_rahatlat', effects: [fx.stat('moral', +4)] }),
        choice('İzin fotoğrafını çek, sonra bakarız', 'g2_envanter', { id: 'g2_ruzgar_iz', effects: [fx.stat('pil', -2)] }),
      ],
    },
  ),
  draft(
    'g2_envanter',
    2,
    'Envanter',
    'Masaya her şeyi dizer, tek tek sayar (fotoğraf). Yanık varsa (yanik_sag_el) eli zonklar, kabarmıştır; pansuman bugün yapılmazsa Gün 3’te enfeksiyon riski. Sonra günün işleri sıralanır.',
    {
      choices: [
        choice('Önce elini sarmamız lazım', 'g2_pansuman', { visibleIf: is.injury('yanik_sag_el') }),
        choice('Önce odun, soba sönmesin', 'g2_odunluk', { id: 'g2_once_odun' }),
        choice('Önce kar erit, su bitmek üzere', 'g2_odunluk', {
          id: 'g2_once_su',
          effects: [fx.set('kar_eritildi'), fx.stat('saglik', +3)],
        }),
      ],
    },
  ),
  draft(
    'g2_pansuman',
    2,
    'Pansuman',
    'Yarım ilk yardım çantasıyla yanığa bakılır. Doğru yol: serin (buz gibi değil) suyla yıkamak, temiz bezle gevşek sarmak. Kar basmak yanlış; Deniz dener, acı artar, pansuman sayılmaz (yanik_pansuman yok).',
    {
      choices: [
        choice('Serin suyla yıka, temiz bezle gevşek sar', 'g2_odunluk', {
          id: 'g2_pansuman_dogru',
          effects: [fx.set('yanik_pansuman'), fx.stat('saglik', +5), fx.stat('moral', +3)],
        }),
        choice('Üstüne biraz kar koy, soğutur', 'g2_odunluk', {
          id: 'g2_pansuman_kar',
          effects: [fx.stat('saglik', -5), fx.stat('isi', -3)],
        }),
        choice('Şimdilik dokunma, sonra bakarız', 'g2_odunluk', { id: 'g2_pansuman_ertele' }),
      ],
    },
  ),
  draft(
    'g2_odunluk',
    2,
    'Odunluk',
    'Yarı gömülü odunluğa gider; görev ~7 dk (away 7m). Kazarken Ozan’ın yedek 15 metrelik ipini bulur (ip eşyası). Dönüşte tencereyle kar getirir. Yanık el baltayı kilitler.',
    {
      choices: [
        choice('Baltayla kütük yar, bol odun olsun', 'g2_cati', {
          id: 'g2_odun_balta',
          requires: is.not(is.injury('yanik_sag_el')),
          lockedReason: 'Elin yanık, baltayı tutamazsın.',
          effects: [fx.give('ip'), fx.stat('isi', +8), fx.stat('saglik', -2)],
        }),
        choice('İnce dalları ve kırık tahtaları topla', 'g2_cati', {
          id: 'g2_odun_dal',
          effects: [fx.give('ip'), fx.stat('isi', +4)],
        }),
      ],
    },
  ),
  draft(
    'g2_cati',
    2,
    'Çatı',
    'Öğleden sonra çatı kirişleri karın ağırlığıyla gıcırdar. Deniz ne yapacağını sorar. Çatıyı boşlamak Gün 5 fırtınasında çökmeye yol açar (g2_cati_birak ziyareti). Ardından pil için ara: 17:00 öncesiyse away until 20:00.',
    {
      choices: [
        choice('Çatıya çık, karı kürekle at', 'g2_aksam', {
          id: 'g2_catiya_cik',
          requires: is.not(is.injury('burkulmus_ayak')),
          lockedReason: 'Ayağın burkuk, çatıya tırmanamazsın.',
          effects: [fx.stat('isi', -5), fx.stat('moral', +3)],
        }),
        choice('Kirişin altına kütükle destek koy', 'g2_aksam', { id: 'g2_cati_destek', effects: [fx.stat('moral', +2)] }),
        choice('Bırak, taş ev bu, dayanır', 'g2_cati_birak'),
      ],
    },
  ),
  draft(
    'g2_cati_birak',
    2,
    'Gıcırtı',
    'Deniz çatıyı bırakır ama gün boyu her gıcırtıda irkilir. (Gün 5’te bu ziyaret kontrol edilir: çatı kısmen çöker.)',
    { next: 'g2_aksam' },
  ),
  draft(
    'g2_aksam',
    2,
    'Üç Yol',
    'Akşam (ya da 20:00 pil oturumu) sobanın başında: Deniz üç yolu tartışır: evde kalıp işaret yapmak, dere yatağından inmek, sinyal için sırta çıkmak. Oyuncunun ilk görüşü kararı bağlamaz, Gün 3’te seçilir; konuşma ~5 dk.',
    {
      choices: [
        choice('Bence kal, seni burada bulurlar', 'g2_isik', { id: 'g2_fikir_kal', effects: [fx.stat('moral', +2)] }),
        choice('Ozan aşağı indi, iz oradadır', 'g2_isik', { id: 'g2_fikir_asagi' }),
        choice('Sırtta sinyal çekebilirsin', 'g2_isik', { id: 'g2_fikir_yukari' }),
      ],
    },
  ),
  draft(
    'g2_isik',
    2,
    'Uzaktaki Işık',
    'Vedalaşırken Deniz pencereden aşağı vadide yanıp sönen küçük bir ışık görür. Karşılık vermek Ozan’la ilk bağı kurar (ozan_izi); ışık iki kez yanıp söner, sonra kaybolur.',
    {
      choices: [
        choice('Kafa lambanla karşılık ver', 'g2_gece', {
          id: 'g2_isik_karsilik',
          requires: is.item('kafa_lambasi'),
          lockedReason: 'Kafa lamban yok.',
          effects: [fx.set('ozan_izi'), fx.stat('moral', +5), fx.stat('pil', -1)],
        }),
        choice('Telefon ışığıyla üç kez yak söndür', 'g2_gece', {
          id: 'g2_isik_telefon',
          effects: [fx.set('ozan_izi'), fx.stat('pil', -4)],
        }),
        choice('Sadece izle, yerini aklında tut', 'g2_gece', { id: 'g2_isik_izle' }),
      ],
    },
  ),
  node('g2_gece', {
    day: 2,
    title: 'Işık Söndü',
    draft:
      'Işık söner. Deniz "sabah yazarım. iyi geceler Frekans" der, uykuya geçer (sleepUntil 08:00). Cliffhanger: kapanmadan önceki son mesaj: "biri benim ışığımı mı gördü, yoksa ben mi deliriyorum".',
    next: 'g3_sabah',
    chapterEnd: 'Gün 2 sonu: vadide yanıp sönen ışık',
  }),
];

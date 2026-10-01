/**
 * "Dağ Evi" tanımları: bayraklar, kalıcı yaralar, eşyalar ve sayısal değerler.
 * Yeni bir bayrak/yara/eşya kullanmadan önce buraya ekle; yoksa derleme ve
 * `npm run validate-story` hata verir.
 */
import { createStoryKit } from '@/engine/kit';

export const kit = createStoryKit({
  stats: {
    saglik: { label: 'Sağlık', initial: 80 },
    /** Deniz'in oyuncuya güveni */
    moral: { label: 'Güven', initial: 50 },
    /** Telefon şarjı (%) */
    pil: { label: 'Pil', initial: 34 },
    /** Vücut ısısı / üşüme; düşükse hipotermi riski */
    isi: { label: 'Isı', initial: 40 },
  },
  injuries: {
    yanik_sag_el: { label: 'Sağ elde yanık', description: 'İp tutma, balta, düğüm atma gibi işler kilitlenir.' },
    burkulmus_ayak: { label: 'Burkulmuş ayak', description: 'Uzun yürüyüş ve iniş seçenekleri zorlaşır.' },
    hipotermi_baslangici: { label: 'Hipotermi başlangıcı', description: 'Titreme, dalgınlık; ısınmazsa sağlık düşer.' },
    enfeksiyon: { label: 'Yara enfeksiyonu', description: 'Pansuman yapılmayan yanıktan; ateş ve halsizlik.' },
    donmus_parmaklar: { label: 'Donmuş parmaklar', description: 'Ayak parmaklarında soğuk ısırığı.' },
  },
  items: {
    kibrit: 'Kuru kibritler (3 tane)',
    kafa_lambasi: 'Kafa lambası',
    ip: '15 metre ip',
    balta: 'Küçük balta',
    ilk_yardim: 'Yarım ilk yardım çantası',
    powerbank: 'Powerbank (boş gibi)',
    harita: 'Kağıt harita',
    duduk: 'Düdük',
    yagmurluk: 'Turuncu yağmurluk',
    konserve: 'İki konserve fasulye',
    cikolata: 'Bir kalıp çikolata',
    termos: 'Termos',
    ozan_batonu: 'Ozan’ın kırık batonu',
  },
  flags: {
    // Gün 1 — ilk temas ve ilişki
    oyuncu_tanisti: 'Oyuncu kendinden biraz bahsetti',
    oyuncu_gizemli: 'Oyuncu kimliğini söylemedi',
    lakap_frekans: 'Deniz oyuncuya "Frekans" demeye başladı',
    konum_gonderildi: 'Deniz konumunu paylaştı',
    kayit_112: 'Deniz bir kez 112’ye bağlanıp kayıt bıraktı',
    // Gün 1 — ısınma ve hayatta kalma
    soba_yandi: 'Soba yakıldı',
    harita_yakildi: 'Soba tutuşturulurken harita yakıldı',
    kibrit_bitti: 'Kuru kibrit kalmadı',
    kuru_kiyafet: 'Islak kıyafetler değiştirildi',
    islak_kiyafet: 'Islak kıyafetlerle kalındı',
    kar_eritildi: 'İçme suyu için kar eritildi',
    cikolata_yendi: 'Çikolata ilk gece yendi',
    pil_tasarrufu: 'Telefon pil tasarrufu modunda',
    disari_cikti_gece: 'İlk gece Ozan’ı aramak için dışarı çıkıldı',
    ozan_izi: 'Ozan’a ait bir iz bulundu',
    kapi_sesi: 'Gün 1 sonu: kapıda bir ses duyuldu (cliffhanger)',
    // Gün 2+ — iskelet (yazıldıkça genişler)
    yanik_pansuman: 'Yanık pansuman yapıldı',
    sos_isareti: 'Kar üstüne SOS işareti yapıldı',
    isaret_yanlis_yer: 'İşaret ağaçların altına, görünmez yere bırakıldı',
    rota_evde_kal: 'Ana dal: evde kalıp yardım beklemek',
    rota_asagi: 'Ana dal: aşağı inmeye çalışmak',
    rota_yukari: 'Ana dal: sinyal için yükseğe çıkmak',
    fener_kayboldu: 'Kafa lambası kayboldu',
    ozan_bulundu: 'Ozan’a ulaşıldı',
    helikopter_goruldu: 'Kurtarma helikopteri görüldü',
    ekip_temas: 'Kurtarma ekibiyle temas kuruldu',
  },
});

export const { say, voice, photo, location, deleted, system, away, sleepUntil, pause, effects, is, fx, choice, node, draft } =
  kit;

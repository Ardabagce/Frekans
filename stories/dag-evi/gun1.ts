/**
 * Gün 1 — "Sinyal"
 *
 * Akış (HIKAYE.md §8): ilk temas → durum → fotoğraf/konum/112 → soba (kritik seçim)
 * → ilk kısa ara (bildirim izni) → ıslak kıyafet → su ve yemek → tanışma ve "Frekans"
 * → Ozan / dışarı çıkma → pil kararı → gün sonu (saat kuralı) + kapıdaki ses → g2_sabah.
 */
import type { StoryNode } from "@/engine/types";

import {
  away,
  choice,
  deleted,
  effects,
  fx,
  is,
  location,
  node,
  pause,
  photo,
  say,
  sleepUntil,
  system,
  voice,
} from "./kit";

// Ekim başı, Kaçkarlar: fırtınalı havada 18:30'dan sonra karanlık, 07:00'ye kadar sürer.
// (timeOfDay'deki 'aksam' 17:00'de başlar; o saatte dışarısı henüz aydınlık.)
const karanlik = is.between("18:30", "07:00");
const aydinlik = is.not(karanlik);
const yanik = is.injury("yanik_sag_el");
const guvensiz = is.stat("moral", { lte: 35 });
/** Önerileri reddettiği iki an (dışarı çıkma, telefonu kapatma) için eşik */
const inatci = is.stat("moral", { lte: 40 });

export const gun1: StoryNode[] = [
  // ---------------------------------------------------------------------------
  // 1. İlk temas
  // ---------------------------------------------------------------------------
  node("g1_ilk_temas", {
    day: 1,
    title: "İlk temas",
    onEnter: [
      fx.give("kibrit"),
      fx.give("kafa_lambasi"),
      fx.give("ip"),
      fx.give("ilk_yardim"),
      fx.give("powerbank"),
      fx.give("harita"),
      fx.give("duduk"),
      fx.give("yagmurluk"),
      fx.give("konserve"),
      fx.give("cikolata"),
      fx.give("termos"),
    ],
    steps: [
      say("merhaba??"),
      say("biri var mı", { delay: "7s" }),
      system("Sinyal zayıf", { tone: "warning" }),
      say("bu numara kimin bilmiyorum", { delay: "5s" }),
      say("yanlış numaraysa özür dilerim gerçekten"),
      say("ama mesaj gidiyor. bir tek bu gidiyor"),
      say("lütfen biri cevap versin"),
    ],
    choices: [
      choice("Merhaba, buradayım. Kimsin?", "g1_kimsin", {
        effects: [fx.stat("moral", +5)],
      }),
      choice("İyi misin? Bir şey mi oldu?", "g1_kimsin", {
        id: "g1_kimsin_endise",
        effects: [fx.stat("moral", +10)],
      }),
      choice("Yanlış numara galiba.", "g1_yanlis_numara", {
        effects: [fx.stat("moral", -5)],
      }),
    ],
  }),

  node("g1_kimsin", {
    day: 1,
    steps: [
      say("tanrım"),
      say("biri var"),
      say("pardon. ellerim titriyor, düzgün yazamıyorum"),
      say("benim adım deinz"),
      say("*deniz"),
    ],
    next: "g1_durum",
  }),

  node("g1_yanlis_numara", {
    day: 1,
    steps: [
      say("biliyorum"),
      say("yani. muhtemelen"),
      say("ama lütfen kapatma", { delay: "2s" }),
      say("iki dakika. sadece iki dakika dinle"),
      say("benim adım deniz"),
    ],
    next: "g1_durum",
  }),

  // ---------------------------------------------------------------------------
  // 2. Kim olduğunu anlatır
  // ---------------------------------------------------------------------------
  node("g1_durum", {
    day: 1,
    title: "Ne oldu",
    steps: [
      say("dağdayım. kaçkarlarda"),
      say(
        "yukarı kavrunun üstünde, çobanların yazın kaldığı taş bir ev var. ordayım",
      ),
      say("dün öğleden sonra hava bozdu"),
      say("arkadaşım ozan aşağı indi. yolu kontrol edip sinyal arayacaktı"),
      say('"bir saate dönerim" dedi'),
      say("dönmedi", { delay: "4s" }),
      say(
        "gece fırtına bastırdı. sabaha karşı bir ses geldi, gök gürültüsü gibi ama yerden",
        { delay: "3s" },
      ),
      say("çığ"),
      say("derenin oralar tamamen gömüldü. ozanın indiği taraf"),
      say("112’yi kaç kere denedim bilmiyorum. arama artık gitmiyor", {
        delay: "3s",
      }),
      say("mesaj da gitmiyor. annem, ozan, iş grubu. hiçbiri"),
      say("annemin numarasını yazarken bir rakamı karıştırmışım galiba"),
      say("o yanlış numara gitti"),
      say("yani sen"),
      say("niye bilmiyorum. bir tek sana gidiyor"),
    ],
    choices: [
      choice("Tamam. Sakin ol, seninleyim.", "g1_tavir_sicak", {
        effects: [fx.stat("moral", +10)],
      }),
      choice(
        "Nasıl olur da sadece bana gidiyor? Şaka mı bu?",
        "g1_tavir_supheci",
        { effects: [fx.stat("moral", -10)] },
      ),
      choice("Önce şunu söyle: yaralı mısın?", "g1_tavir_pratik", {
        effects: [fx.stat("moral", +5)],
      }),
    ],
  }),

  node("g1_tavir_sicak", {
    day: 1,
    steps: [
      say("tamam"),
      say("seninleyim. bunu biri yazınca başka oluyormuş"),
      say("teşekkür ederim"),
      say("ağlamayacağım. şu an değil", { delay: "3s" }),
      say("sesimi duysan titrediğini anlardın. iyi ki yazıyoruz"),
      say("dur sana göstereyim nerdeyim"),
    ],
    next: "g1_fotograf",
  }),

  node("g1_tavir_supheci", {
    day: 1,
    steps: [
      say("şaka olsa keşke"),
      say("ben de anlamıyorum. teknik olarak mümkün mü onu bile bilmiyorum", {
        delay: "2s",
      }),
      say("ama şu an teknikle uğraşacak halim yok"),
      say("istersen engelle. gerçekten anlarım", { delay: "3s" }),
      say("ama önce bir bak. kanıt istiyorsan dur"),
    ],
    next: "g1_fotograf",
  }),

  node("g1_tavir_pratik", {
    day: 1,
    steps: [
      say("yaralı değilim. sanırım"),
      say("dizimi bir yere vurmuşum, morarmış ama yürüyorum"),
      say("asıl sorun soğuk"),
      say("ve ozan. ama ona birazdan geleceğim, yoksa yazamam"),
      say("dur göstereyim"),
    ],
    next: "g1_fotograf",
  }),

  // ---------------------------------------------------------------------------
  // 3. Konum ve fotoğraf, 112
  // ---------------------------------------------------------------------------
  node("g1_fotograf", {
    day: 1,
    title: "Pencere",
    onEnter: [fx.stat("pil", -1)],
    steps: [
      photo("karli-pencere", "pencereden", { delay: "7s" }),
      say("kapı bu tarafta. önü dize kadar kar"),
      say(
        "dışarısı simsiyah. lambayı cama tutunca sadece dönüp duran kar taneleri",
        { if: karanlik },
      ),
      say(
        "her yer bembeyaz. gök nerede bitiyor yer nerede başlıyor seçemiyorum",
        { if: aydinlik },
      ),
      say("rüzgar kapıyı zorluyor. her seferinde biri itiyor sanıyorum"),
      say("pil %33. dikkatli kullanmam lazım"),
    ],
    choices: [
      choice("Konumunu gönder, nerede olduğunu bileyim.", "g1_konum", {
        effects: [fx.stat("moral", +3)],
      }),
      choice("112’ye hiç ulaşabildin mi?", "g1_112"),
      choice("Ben senin için 112’yi arayayım mı?", "g1_ben_arayayim"),
    ],
  }),

  node("g1_konum", {
    day: 1,
    onEnter: [fx.set("konum_gonderildi")],
    steps: [
      say("tamam dur"),
      location("Dağ evi · Kaçkar, Yukarı Kavrun üstü", 40.8862, 41.1517, {
        delay: "3s",
      }),
      say("gitti mi? bende gitti görünüyor"),
      say("garip. en azından biri biliyor şimdi nerede olduğumu"),
    ],
    next: [{ if: is.visited("g1_112"), to: "g1_soguk" }, { to: "g1_112" }],
  }),

  node("g1_ben_arayayim", {
    day: 1,
    steps: [
      say("yok yok"),
      say("çok tatlısın ama gerek yok, gerçekten"),
      say("bir kere bağlandım zaten. dur anlatayım"),
    ],
    next: "g1_112",
  }),

  node("g1_112", {
    day: 1,
    title: "112 kaydı",
    onEnter: [fx.set("kayit_112")],
    steps: [
      say("bir de 112 var. onu anlatmadım daha", {
        if: is.visited("g1_konum"),
        delay: "2s",
      }),
      say("sabaha karşı bir kere bağlandı"),
      say("40 saniye falan"),
      say("karşıdaki kadın çok sakindi. adımı, nerede olduğumu aldı"),
      say(
        "kayıt açtık dedi. fırtına dinince ekip çıkacakmış. şu an ne helikopter kalkar ne araç çıkar",
      ),
      say("sonra kesildi. bir daha da bağlanmadı"),
      say(
        "o 40 saniye boyunca hiç bu kadar net konuşmadım hayatımda. reklam sunumlarında bile",
      ),
      say("yani", { delay: "3s" }),
      say("kaydım var zaten. sen benimle kal yeter"),
    ],
    choices: [
      choice("Kalıyorum. Bir yere gitmiyorum.", "g1_soguk", {
        effects: [fx.stat("moral", +5)],
      }),
      choice("Konumunu da at bana, içim rahat etsin.", "g1_konum", {
        id: "g1_konum_sonra",
        visibleIf: is.not(is.flag("konum_gonderildi")),
      }),
      choice("Fırtına dinene kadar? O ne zaman, belli mi?", "g1_ne_zaman", {
        id: "g1_soguk_ne_zaman",
        effects: [fx.stat("moral", -3)],
      }),
    ],
  }),

  node("g1_ne_zaman", {
    day: 1,
    steps: [
      say("bilmiyorum"),
      say("kimse bilmiyor", { delay: "2s" }),
      say(
        'evde olsam hava durumuna bakardım. "yarın öğleden sonra açılıyor" derdi, inanırdım',
      ),
      say("burda hava durumu benim. pencereye bakıyorum, o kadar"),
    ],
    next: "g1_soguk",
  }),

  // ---------------------------------------------------------------------------
  // 4. Soğuk ve soba (kritik seçim)
  // ---------------------------------------------------------------------------
  node("g1_soguk", {
    day: 1,
    title: "Soğuk",
    steps: [
      say("neyse", { delay: "2s" }),
      say("çok üşüyorum"),
      say("ellerimi hissetmiyorum. parmak uçlarım bembeyaz"),
      say("telefonun ekranına dokununca bile acıyor"),
      say("bu yüzden yavaş yazıyorum, kusura bakma"),
    ],
    choices: [
      choice("Önce ellerini koltuk altına sok, biraz ısıt.", "g1_eller", {
        effects: [fx.stat("moral", +3)],
      }),
      choice("Eller sonra. Önce ateş lazım, etrafına bak.", "g1_soba_secim"),
    ],
  }),

  node("g1_eller", {
    day: 1,
    onEnter: [fx.stat("isi", +3)],
    steps: [
      say("tamam"),
      say("montun içine, koltuk altlarıma soktum", { delay: "3s" }),
      say("kendime sarılmış gibi duruyorum. kimse görmüyor neyse ki", {
        delay: "12s",
      }),
      say("iğne iğne batıyor. ama geri geliyorlar"),
      say("tamam. parmaklarım pembe. şimdi ateş"),
    ],
    next: "g1_soba_secim",
  }),

  node("g1_soba_secim", {
    day: 1,
    title: "Sönük soba",
    onEnter: [fx.give("balta")],
    steps: [
      say("burda bir soba var. döküm, eski"),
      say("dünden beri sönük"),
      photo("soba", "tanıştırayım: soba", { delay: "6s" }),
      say("hep ozan yakardı. ben çay demlerdim"),
      say("kibirtlerin çoğu ıslandı"),
      say("*kibritlerin"),
      say("3 tane kuru kaldı. saydım, 3"),
      say(
        "kapının arkasında küçük bir balta buldum. köşede birkaç kalın kütük var",
      ),
      say(
        "rafta bir şişe lamba yağı, bir paket mum, yarım bir ilk yardım çantası",
      ),
      say("bir de çantamda haritam var, kağıt"),
      say("nasıl yakayım bunu"),
    ],
    choices: [
      choice("Baltayla ince çıra yont, sabırla yak.", "g1_cira", {
        effects: [fx.stat("moral", +3)],
      }),
      choice("Lamba yağı var ya, onu döksen?", "g1_yag"),
      choice("Haritadan biraz yırt, tutuşturucu olsun.", "g1_harita_yak"),
      choice("Kibriti doğrudan kütüğe tut, belki tutar.", "g1_kutuk"),
    ],
  }),

  node("g1_cira", {
    day: 1,
    steps: [
      say("tamam. sabır"),
      say("sabır en güçlü yanım değil ama"),
      say("kütüğün kenarından ince ince yontuyorum", { delay: "4s" }),
      say("parmaklarım tutmuyor. balta iki kere kaydı", { delay: "22s" }),
      say(
        "ama bir avuç oldu. kibrit inceliğinde olanlar altta, kalınlar üstte",
      ),
      say("ilk kibrit", { delay: "12s" }),
      say("söndü", { delay: "6s" }),
      say("kapının altından giren rüzgar söndürdü"),
      say("iki tane kaldı"),
    ],
    choices: [
      choice("Avucunla siper yap, alevi rüzgardan koru.", "g1_cira_siper", {
        effects: [fx.stat("moral", +3)],
      }),
      choice("Hemen ikinciyi çak, vakit kaybetme!", "g1_cira_acele"),
    ],
  }),

  node("g1_cira_siper", {
    day: 1,
    onEnter: [fx.set("soba_yandi"), fx.stat("isi", +15)],
    steps: [
      say("tamam. sırtımı kapıya verdim, avucumu kapattım"),
      say("ikinci", { delay: "10s" }),
      say("tuttu", { delay: "6s" }),
      say("TUTTU"),
      say("çıra çıtırdıyor. nefesimi tutuyorum, sönmesin diye"),
      say("kalın bir parça koydum. o da tutuyor"),
      say("bir kibrit arttı. göğüs cebime koydum. saçma ama oraya"),
    ],
    next: "g1_soba_yandi",
  }),

  node("g1_cira_acele", {
    day: 1,
    onEnter: [
      fx.set("soba_yandi"),
      fx.set("kibrit_bitti"),
      fx.take("kibrit"),
      fx.stat("isi", +12),
      fx.stat("moral", -2),
    ],
    steps: [
      say("ikinci", { delay: "4s" }),
      say("o da gitti. çıraya bile değmedi"),
      say("tamam panik yok"),
      say("panik var aslında"),
      say("üçüncü. son", { delay: "10s" }),
      say("...", { delay: "8s" }),
      say("tuttu"),
      say("tuttu ama kibrit kalmadı"),
      say("bu soba bir daha sönerse yakacak hiçbir şeyim yok"),
    ],
    next: "g1_soba_yandi",
  }),

  node("g1_kutuk", {
    day: 1,
    onEnter: [fx.stat("moral", -5), fx.stat("isi", -3)],
    steps: [
      say("deniyorum"),
      say("iki kibrit gitti", { delay: "18s" }),
      say("kütüğün kabuğu bile kararmadı. sadece biraz is"),
      say("bir tane kaldı"),
      say("bir tane", { delay: "3s" }),
      say("akıllıca bir şey söyle lütfen"),
    ],
    choices: [
      choice(
        "Son kibriti boşa harcama. Önce ince çıra yont.",
        "g1_kutuk_cira",
        { effects: [fx.stat("moral", +3)] },
      ),
      choice("O zaman lamba yağıyla garantile.", "g1_yag", {
        id: "g1_yag_son",
      }),
      choice("Haritadan yırt, kağıt hemen tutar.", "g1_harita_yak", {
        id: "g1_harita_son",
      }),
    ],
  }),

  node("g1_kutuk_cira", {
    day: 1,
    onEnter: [
      fx.set("soba_yandi"),
      fx.set("kibrit_bitti"),
      fx.take("kibrit"),
      fx.stat("isi", +12),
    ],
    steps: [
      say("tamam"),
      say("baltayla yontuyorum. ince ince", { delay: "3s" }),
      say("ellerim kızardı ama bir avuç çıra oldu", { delay: "20s" }),
      say("son kibrit", { delay: "6s" }),
      say("...", { delay: "8s" }),
      say("tuttu"),
      say("tuttu tuttu tuttu"),
      say("ama artık kibritim yok. bu soba sönmeyecek. sönemez"),
    ],
    next: "g1_soba_yandi",
  }),

  node("g1_yag", {
    day: 1,
    title: "Yanık",
    onEnter: [
      fx.injure("yanik_sag_el"),
      fx.stat("saglik", -15),
      fx.stat("moral", -8),
      fx.set("soba_yandi"),
      fx.stat("isi", +10),
    ],
    steps: [
      effects([fx.set("kibrit_bitti"), fx.take("kibrit")], {
        if: is.visited("g1_kutuk"),
      }),
      say("tamam. aslında mantıklı"),
      say("kapağı açtım, kütüklerin üstüne dökü yorum"),
      say("*döküyorum"),
      say("son kibrit bu bu arada", { if: is.visited("g1_kutuk") }),
      say("kibrit", { delay: "6s" }),
      deleted({ delay: "9s" }),
      say("pardon"),
      say("alev bir anda patladı. sobanın ağzından dışarı"),
      say("elim tam önündeydi"),
      say("sağ elim", { delay: "3s" }),
      say("yanıyor. çok yanıyor"),
      say("soba yandı ama. komik değil mi", { delay: "4s" }),
    ],
    choices: [
      choice("Hemen soğuk suya tut. Kar değil, su.", "g1_yanik_su", {
        effects: [fx.stat("moral", +6)],
      }),
      choice("Kara mı bassan? Hemen soğutur belki.", "g1_yanik_kar"),
      choice(
        "İlk yardım çantasında yanık için bir şey var mı?",
        "g1_yanik_canta",
        { effects: [fx.stat("moral", +2)] },
      ),
    ],
  }),

  node("g1_yanik_su", {
    day: 1,
    onEnter: [fx.stat("saglik", +5)],
    steps: [
      say("kovada dünden kalan su var. üstü buz tutmuş, kırdım"),
      say("elimi soktum", { delay: "5s" }),
      say("ahh"),
      say("tamam. biraz iyi. sanki biraz iyi"),
      say(
        'bir ilk yardım kursunun reklam metnini ben yazmıştım. "yanığa buz değil, serin su. yirmi dakika."',
      ),
      say("slogan bile değildi. ama aklımda kalmış, bak"),
      say("bu su buzdan hallice. ara ara çıkarıp tekrar sokuyorum"),
    ],
    next: "g1_soba_yandi",
  }),

  node("g1_yanik_kar", {
    day: 1,
    onEnter: [fx.stat("saglik", -5), fx.stat("isi", -5), fx.stat("moral", -3)],
    steps: [
      say("kar. tamam"),
      say("kapıyı araladım, bir avuç aldım", { delay: "8s" }),
      say("ilk saniye iyi geldi"),
      say("sonra", { delay: "3s" }),
      say("sonra sanki ikinci kere yandı. iğne gibi batıyor"),
      say("bıraktım. kovada dünden kalan su vardı, ona soktum. o daha iyi"),
    ],
    next: "g1_soba_yandi",
  }),

  node("g1_yanik_canta", {
    day: 1,
    onEnter: [fx.stat("saglik", +2)],
    steps: [
      say("baktım. tek elle"),
      say("gazlı bez, iki yara bandı, bir şerit ağrı kesici. yanık kremi yok"),
      say("kovada dünden kalan su var, elimi ona soktum. bezi sonra sararım"),
      say("ağrı kesiciden de bir tane içtim"),
    ],
    next: "g1_soba_yandi",
  }),

  node("g1_harita_yak", {
    day: 1,
    title: "Harita",
    onEnter: [
      fx.take("harita"),
      fx.set("harita_yakildi"),
      fx.set("soba_yandi"),
      fx.stat("isi", +12),
    ],
    steps: [
      effects([fx.set("kibrit_bitti"), fx.take("kibrit")], {
        if: is.visited("g1_kutuk"),
      }),
      say("haritayı mı"),
      say("ozanın kurşun kalemle işaretlediği rotalar var üstünde"),
      say("emin misin?", { if: guvensiz }),
      say("...neyse. başka kağıt yok zaten", { if: guvensiz, delay: "4s" }),
      say("tamam. kağıt kağıttır", { if: is.not(guvensiz) }),
      say("kenarından yırtıyorum. önce yayla kısmı"),
      say("sonra dere kısmı", { delay: "4s" }),
      say("son kibrit bu bu arada", { if: is.visited("g1_kutuk") }),
      say("kibrit", { delay: "8s" }),
      say("tuttu. kağıt resmen bekliyormuş"),
      say(
        "yarısı gitti. kalan yarısı da ıslanmış, mürekkep akmış. onu da attım",
      ),
      say("ozan bunu duysa çok kızardı"),
    ],
    next: "g1_soba_yandi",
  }),

  node("g1_soba_yandi", {
    day: 1,
    title: "Soba yandı",
    onEnter: [fx.stat("pil", -1)],
    steps: [
      say("yanıyor", { delay: "4s" }),
      say("kapaktan yere turuncu bir ışık vuruyor"),
      say("çıtırtısı şu an dünyanın en güzel sesi"),
      say("ellerimi kapağa yaklaştırdım. yüzüm ısınıyor, sırtım hala buz", {
        delay: "3s",
      }),
      say("camdaki buz çiçekleri eriyor yavaş yavaş"),
      say("elim zonkluyor ama olsun. en azından ısınıyorum", { if: yanik }),
      voice(
        8,
        "duyuyor musun? bu ses... tamam. tamam, yaşıyoruz. sanırım yaşıyoruz.",
        { delay: "3s" },
      ),
      say("sesli attım, parmaklarım yazmıyordu"),
      say("dün geceden beri ilk defa düzgün nefes alıyorum", { delay: "5s" }),
      say("bir şey anlat bana. herhangi bir şey"),
      say("iki dakika dağ yokmuş gibi yapalım"),
    ],
    choices: [
      choice("Şu an elimde sıcak bir çay var. Pardon.", "g1_mola_cay", {
        effects: [fx.stat("moral", +2)],
      }),
      choice("En sevdiğin kötü film hangisi?", "g1_mola_film"),
      choice("Ozan nasıl biri? Onunla ilgili bir şey anlat.", "g1_mola_ozan", {
        effects: [fx.stat("moral", +1)],
      }),
    ],
  }),

  node("g1_mola_cay", {
    day: 1,
    steps: [
      say("çay"),
      say("ÇAY"),
      say("bunu bana nasıl yaparsın"),
      say("şaka şaka. iç. benim yerime de iç", { delay: "2s" }),
      say("demli mi bari? açık çay içen insana güvenmem"),
      say("kurtulunca ilk iş bir çay. ince belli bardakta. bunu bir yere yaz"),
    ],
    next: "g1_odun",
  }),

  node("g1_mola_film", {
    day: 1,
    steps: [
      say("ooo"),
      say("doğru kişiye sordun"),
      say(
        "bir buzdolabının sahibine aşık olduğu bir film var. buzdolabı kıskanıp evdekileri dondurmaya başlıyor",
      ),
      say("iki kere izledim. ikisinde de ağladım"),
      say("şu an o buzdolabının içindeyim bu arada", { delay: "3s" }),
      say("karma"),
    ],
    next: "g1_odun",
  }),

  node("g1_mola_ozan", {
    day: 1,
    steps: [
      say("ozan"),
      say("ilk kampımızda çadırımı ters kurmuştum. kapısı rüzgara bakıyordu"),
      say(
        "gece yağmur bastırdı. ozan kendi çadırını bana verdi, kendisi sabaha kadar kayanın dibinde oturdu",
      ),
      say("sabah tek kelime etmedi. sadece elime bir çay tutuşturdu"),
      say("o günden beri çayı hep ben demlerim. borcumu öyle ödüyorum", {
        delay: "3s",
      }),
      say("gelecek. o hep gelir", { delay: "4s" }),
    ],
    next: "g1_odun",
  }),

  // ---------------------------------------------------------------------------
  // 5. İlk kısa ara (bildirim izni anı)
  // ---------------------------------------------------------------------------
  node("g1_odun", {
    day: 1,
    steps: [
      say("tamam", { delay: "3s" }),
      say("iyi geldi. sağ ol"),
      say("ama sobanın iştahı açıldı. içerdeki kütükler sabaha yetmez"),
      say("odunluktan odun çekip geleceğim. pil için telefonu kapatıyorum"),
      say("birazdan yazarım"),
    ],
    choices: [
      choice("Tamam, buradayım. Bekliyorum.", "g1_ilk_ara", {
        effects: [fx.stat("moral", +3)],
      }),
      choice("Kapatma, konuşmaya devam edelim.", "g1_ilk_ara_itiraz", {
        effects: [fx.stat("moral", -2)],
      }),
    ],
  }),

  node("g1_ilk_ara_itiraz", {
    day: 1,
    steps: [
      say("biliyorum"),
      say("ama pil %32 oldu bile. her mesaj bir damla"),
      say("iki dakika. söz"),
    ],
    next: "g1_ilk_ara",
  }),

  node("g1_ilk_ara", {
    day: 1,
    title: "İlk ara",
    steps: [
      say("görüşürüz"),
      away({
        for: "2m30s",
        askNotifications: true,
        notice: "Deniz’in bağlantısı koptu",
      }),
    ],
    next: "g1_donus",
  }),

  // ---------------------------------------------------------------------------
  // 6. Islak kıyafet
  // ---------------------------------------------------------------------------
  node("g1_donus", {
    day: 1,
    title: "Islak kıyafet",
    onEnter: [fx.stat("pil", -1)],
    steps: [
      say("geldim"),
      say("telefon açılırken kalbim duracaktı. ya artık gitmezse diye"),
      say("odunluk yarı gömülmüş. ellerimle kazıp dört kütük çıkardım", {
        if: is.not(yanik),
      }),
      say("odunluk yarı gömülmüş. sol elimle kazdım, iki kütük çıkarabildim", {
        if: yanik,
      }),
      say("soba gürül gürül"),
      say(
        "sağ elimi bezle sardım. yine de zonkluyor, kalbim elimde atıyor sanki",
        { if: yanik },
      ),
      say("şimdi fark ettim", { delay: "3s" }),
      say("kazarken botlarımın içi karla dolmuş. çoraplarım sırılsıklam"),
      say("pantolonun dizden aşağısı da ıslak, buz gibi yapışıyor"),
      say(
        "çantada yedek çorap ve eşofman var ama bu soğukta soyunmak... hiç içimden gelmiyor",
      ),
      say("sobanın dibinde otursam üstümde kurur mu?"),
    ],
    choices: [
      choice("Hemen değiştir. Islak kıyafet seni daha çok üşütür.", "g1_kuru", {
        effects: [fx.stat("moral", +2)],
      }),
      choice("Sobanın dibinde otur, üstünde kurur.", "g1_islak"),
    ],
  }),

  node("g1_kuru", {
    day: 1,
    onEnter: [fx.set("kuru_kiyafet"), fx.stat("isi", +8)],
    steps: [
      say("emin misin? çok soğuk ama", { if: guvensiz }),
      say("tamam tamam. mantıklı", { if: guvensiz }),
      say("haklısın", { if: is.not(guvensiz) }),
      say("tek elle soyunmak ayrı bir spor dalıymış", { if: yanik }),
      say("tamam. değiştim", { delay: "8s" }),
      say("kuru çorap. hayatımda giydiğim en güzel şey"),
      say("ıslakları sobanın yanına astım, buhar çıkıyor"),
    ],
    next: "g1_su",
  }),

  node("g1_islak", {
    day: 1,
    onEnter: [fx.set("islak_kiyafet"), fx.stat("isi", -10)],
    steps: [
      say("tamam. sobaya yanaşıyorum"),
      say("dizlerimden buhar çıkıyor. komik görünüyorum herhalde"),
      say("ama sırtım hala buz gibi", { delay: "6s" }),
      say("ayak parmaklarımı oynatıyorum, hissetmek için"),
      say("olsun. kurur"),
    ],
    next: "g1_su",
  }),

  // ---------------------------------------------------------------------------
  // 7. Su ve yemek
  // ---------------------------------------------------------------------------
  node("g1_su", {
    day: 1,
    title: "Su",
    steps: [
      say("bir de susadım", { delay: "3s" }),
      say("termos boş. kovadaki suyu da elime harcadım", { if: yanik }),
      say("termos boş. kovadaki su da buz tutmuş, dibinde bir parmak kalmış", {
        if: is.not(yanik),
      }),
      say("dışarısı kar dolu ama"),
      say("kapıyı aralayıp bir avuç alsam?"),
    ],
    choices: [
      choice("Tencerede kar erit, sobada. Sonra iç.", "g1_kar_erit", {
        effects: [fx.stat("moral", +2)],
      }),
      choice("Biraz kar ye, şimdilik idare eder.", "g1_kar_ye"),
    ],
  }),

  node("g1_kar_erit", {
    day: 1,
    onEnter: [
      fx.set("kar_eritildi"),
      fx.stat("isi", +4),
      fx.stat("saglik", +2),
    ],
    steps: [
      say(
        "tencereyi doldurdum. kar eriyince yarıya iniyor, bir daha doldurdum",
      ),
      say("ılık su", { delay: "6s" }),
      say("içine hiçbir şey koymadım ama çay gibi geliyor"),
      say("termosu da doldurdum. sabaha kalsın"),
    ],
    next: "g1_yemek",
  }),

  node("g1_kar_ye", {
    day: 1,
    onEnter: [fx.stat("isi", -6), fx.stat("saglik", -2)],
    steps: [
      say("yedim"),
      say("dişlerim sızladı"),
      say("ve şimdi içim titriyor", { delay: "4s" }),
      say("galiba kötü fikirdi. içimdeki sobayı söndürdüm sanki"),
      say("sonrakini tencerede eritirim"),
    ],
    next: "g1_yemek",
  }),

  node("g1_yemek", {
    day: 1,
    title: "Çikolata",
    steps: [
      say("karnım guruldadı. sobanın sesini bastırdı"),
      say("envanter: iki konserve fasulye, bir kalıp çikolata"),
      say("ozanın çantası onunla gitti. yemeklerin çoğu ondaydı"),
      say("çikolatayı şimdi mi yesem"),
    ],
    choices: [
      choice("Çikolatayı ye, şu an enerjiye ihtiyacın var.", "g1_cikolata_ye"),
      choice("Sakla. Daha zor anlar gelebilir.", "g1_cikolata_sakla"),
      choice("Konserveyi sobada ısıt, çikolata kalsın.", "g1_konserve", {
        requires: is.not(yanik),
        lockedReason: "Elin yanık, konserveyi açamazsın.",
      }),
    ],
  }),

  node("g1_cikolata_ye", {
    day: 1,
    onEnter: [
      fx.set("cikolata_yendi"),
      fx.take("cikolata"),
      fx.stat("isi", +4),
      fx.stat("moral", +3),
    ],
    steps: [
      say("hepsini yedim", { delay: "5s" }),
      say("pişman değilim"),
      say("tamam biraz pişmanım"),
      say("hayır değilim"),
    ],
    next: "g1_tanisma",
  }),

  node("g1_cikolata_sakla", {
    day: 1,
    onEnter: [fx.stat("moral", +1)],
    steps: [
      say("haklısın"),
      say("çantanın en dibine koydum. görmeyeyim diye"),
      say("görüyorum ama. aklımda", { delay: "3s" }),
      say("suyu içtim, onunla idare ediyorum", { if: is.flag("kar_eritildi") }),
    ],
    next: "g1_tanisma",
  }),

  node("g1_konserve", {
    day: 1,
    onEnter: [fx.stat("saglik", +4), fx.stat("isi", +3)],
    steps: [
      say("baltanın köşesiyle açtım. kahramanlık"),
      say("kutuyu sobanın üstüne koydum", { delay: "3s" }),
      say("fasulye kokusu", { delay: "8s" }),
      say("yarısını yedim, yarısı sonraya"),
      say("bu kadar mutlu olacağımı bilsem yıllar önce dağa çıkardım"),
    ],
    next: "g1_tanisma",
  }),

  // ---------------------------------------------------------------------------
  // 8. Tanışma ve "Frekans"
  // ---------------------------------------------------------------------------
  node("g1_tanisma", {
    day: 1,
    title: "Tanışma",
    steps: [
      say("bu arada", { delay: "3s" }),
      say("bunca zamandır sana yazıyorum ve kim olduğunu bilmiyorum"),
      say(
        "gecenin bu saatinde uyanıksın. uykusuz biri misin yoksa ben mi uyandırdım",
        { if: is.timeOfDay("gece") },
      ),
      say("sabah sabah bir yabancının derdiyle uğraşıyorsun", {
        if: is.timeOfDay("sabah"),
      }),
      say("günün ortasında bir yabancının derdiyle uğraşıyorsun", {
        if: is.timeOfDay("ogle"),
      }),
      say("akşam akşam bir yabancının derdiyle uğraşıyorsun", {
        if: is.timeOfDay("aksam"),
      }),
      say("kimsin sen?"),
    ],
    choices: [
      choice(
        "Şehirde, sıcak bir odada oturan sıradan biriyim.",
        "g1_tanis_acik",
      ),
      choice(
        "Kim olduğum önemli değil. Buradayım, o yeter.",
        "g1_tanis_gizemli",
      ),
      choice("Önce sen anlat. Kimsin, neden oradasın?", "g1_tanis_sen", {
        effects: [fx.stat("moral", +2)],
      }),
    ],
  }),

  node("g1_tanis_sen", {
    day: 1,
    steps: [
      say("ben mi"),
      say("istanbulda bir reklam ajansında metin yazarıyım"),
      say("yani bütün gün deterjan için şiir yazıyorum"),
      say(
        "ozanla üniversitede tanıştık. o dağcılık kulübündeydi, ben kulübün afişlerini yazıyordum",
      ),
      say(
        'bu yürüyüş onun fikriydi. "iki gece dağ, telefon çekmez, kafan boşalır" dedi',
      ),
      say("telefon çekmez", { delay: "3s" }),
      say("dilek tutarken dikkatli olacakmışsın"),
      say("neyse. sıra sende"),
    ],
    choices: [
      choice(
        "Şehirde, sıcak bir odada oturan sıradan biriyim.",
        "g1_tanis_acik",
      ),
      choice(
        "Kim olduğum önemli değil. Buradayım, o yeter.",
        "g1_tanis_gizemli",
      ),
    ],
  }),

  node("g1_tanis_acik", {
    day: 1,
    onEnter: [fx.set("oyuncu_tanisti"), fx.stat("moral", +8)],
    steps: [
      say("sıcak bir oda"),
      say("şu an bundan daha kıskandırıcı bir cümle duymadım"),
      say("ama iyi. sıradan iyi", { delay: "3s" }),
      say("sıradan biriyle konuşmak iyi geliyor. dünya hala yerinde gibi"),
    ],
    next: "g1_frekans",
  }),

  node("g1_tanis_gizemli", {
    day: 1,
    onEnter: [fx.set("oyuncu_gizemli")],
    steps: [
      say("hm. tamam", { if: guvensiz }),
      say("gizemli bir yabancı. tam ihtiyacım olan", { if: guvensiz }),
      say("...pardon. biraz gerginim", { if: guvensiz, delay: "4s" }),
      say("gizemli", { if: is.not(guvensiz) }),
      say("tamam, sevdim", { if: is.not(guvensiz) }),
      say("kafamda sana bir yüz uyduracağım o zaman. itiraz yok", {
        if: is.not(guvensiz),
      }),
    ],
    next: "g1_frekans",
  }),

  node("g1_frekans", {
    day: 1,
    title: "Frekans",
    onEnter: [fx.set("lakap_frekans")],
    steps: [
      say("biliyor musun", { delay: "4s" }),
      say("bütün numaralar ölü. bir tek seninki tutuyor"),
      say("sanki aynı frekanstayız. eski radyolar gibi"),
      say("evet saçma. üşüyünce felsefe yapıyorum"),
      say("sana frekans diyeceğim"),
      say("Frekans. büyük harfle"),
    ],
    choices: [
      choice("Frekans mı? Hoşuma gitti.", "g1_deniz_anlatir", {
        effects: [fx.stat("moral", +5)],
      }),
      choice("Garip bir lakap ama… olur.", "g1_deniz_anlatir", {
        id: "g1_frekans_garip",
        effects: [fx.stat("moral", -2)],
      }),
    ],
  }),

  node("g1_deniz_anlatir", {
    day: 1,
    steps: [
      say("iyi. kalıcı oldu, geri alamazsın", {
        if: is.stat("moral", { gte: 55 }),
      }),
      say("madem sen anlattın, sıra bende", {
        if: is.all(
          is.flag("oyuncu_tanisti"),
          is.not(is.visited("g1_tanis_sen")),
        ),
        delay: "3s",
      }),
      say(
        "sen anlatmıyorsun, ben anlatayım bari. susunca kafam kötü yerlere gidiyor",
        {
          if: is.all(
            is.flag("oyuncu_gizemli"),
            is.not(is.visited("g1_tanis_sen")),
          ),
          delay: "3s",
        },
      ),
      say("istanbulda bir reklam ajansında metin yazarıyım", {
        if: is.not(is.visited("g1_tanis_sen")),
      }),
      say("yani bütün gün deterjan için şiir yazıyorum", {
        if: is.not(is.visited("g1_tanis_sen")),
      }),
      say(
        "ozan üniversiteden. o dağcılık kulübündeydi, ben kulübün afişlerini yazıyordum",
        {
          if: is.not(is.visited("g1_tanis_sen")),
        },
      ),
      say(
        'bu yürüyüş onun fikriydi. "iki gece, telefon çekmez, kafan boşalır" dedi',
        {
          if: is.not(is.visited("g1_tanis_sen")),
        },
      ),
      say("kafam boşaldı gerçekten. içinde sadece korku kaldı", {
        if: is.not(is.visited("g1_tanis_sen")),
      }),
      say(
        'ajansta herkes "yeni bir başlangıç lazım sana" diyordu. o kadar yeni değil diye düşünmüştüm',
        {
          if: is.visited("g1_tanis_sen"),
        },
      ),
      say("sıcak odanı kafamda kurdum bu arada. halı var. bir de çaydanlık", {
        if: is.flag("oyuncu_tanisti"),
      }),
    ],
    next: "g1_ozan",
  }),

  // ---------------------------------------------------------------------------
  // 9. Ozan: dışarı çıkmak
  // ---------------------------------------------------------------------------
  node("g1_ozan", {
    day: 1,
    title: "Ozan",
    steps: [
      say("ozanı düşünüyorum durmdan", { delay: "3s" }),
      say("*durmadan"),
      say("o hep bilen taraftı. ben arkasından giderdim"),
      say("şimdi ben burda sobanın başındayım, o..."),
      say("bilmiyorum", { delay: "3s" }),
      say("dışarısı zifiri karanlık ama kafa lambam var", { if: karanlik }),
      say(
        "fırtına biraz durulmuş gibi. hala bembeyaz bir duvar ama rüzgar kesik",
        { if: aydinlik },
      ),
      say("çıkıp bakmak istiyorum. derenin başına kadar. belki bir iz bulurum"),
    ],
    choices: [
      choice("Çıkma lütfen. Kaybolursan seni kimse bulamaz.", "g1_kal"),
      choice("Çık ama ipi kapıya bağla, ucunu beline dola.", "g1_disari_ipli", {
        requires: is.not(yanik),
        lockedReason: "Elin yanık, ipi düğümleyemezsin.",
      }),
      choice("Hızlıca bak ve dön. Beş dakika, fazla değil.", "g1_disari"),
    ],
  }),

  node("g1_kal", {
    day: 1,
    steps: [pause("3s")],
    next: [{ if: inatci, to: "g1_kal_dinlemez" }, { to: "g1_kal_ikna" }],
  }),

  node("g1_kal_ikna", {
    day: 1,
    onEnter: [fx.stat("moral", +5), fx.stat("isi", +3)],
    steps: [
      say("..."),
      say("haklısın"),
      say("biliyorum haklısın"),
      say('ozan olsa aynısını söylerdi. "gece dağda kahramanlık olmaz" derdi', {
        if: karanlik,
      }),
      say(
        'ozan olsa aynısını söylerdi. "beyaz duvarda kahramanlık olmaz" derdi',
        { if: aydinlik },
      ),
      say("ama her rüzgar sesinde kapıya bakıyorum", { delay: "3s" }),
      say("içim içimi yiyor"),
      say("kayıt var. fırtına dinince arayacaklar. tutunacağım şey bu", {
        if: is.flag("kayit_112"),
      }),
    ],
    next: "g1_rota",
  }),

  node("g1_kal_dinlemez", {
    day: 1,
    steps: [
      say("hayır"),
      say("bunu yapmayacağım. burada oturup beklemeyeceğim"),
      say("seni tanımıyorum bile. o benim arkadaşım", { delay: "2s" }),
      say("çıkıyorum. kısa"),
    ],
    next: "g1_disari",
  }),

  node("g1_disari", {
    day: 1,
    title: "Dışarı",
    onEnter: [
      fx.set("disari_cikti_gece"),
      fx.stat("isi", -8),
      fx.stat("pil", -2),
    ],
    steps: [
      say("yağmurluğu giydim. kapıyı zor açtım, kar içeri doldu"),
      say("çıktım", { delay: "8s" }),
      say("kar dizime kadar. her adımda gömülüyorum"),
      say("kafa lambası iki metre ötesini gösteriyor. gerisi dönüp duran kar", {
        if: karanlik,
      }),
      say("her şey beyaz. arkama baktım, ev neredeyse kayboldu", {
        if: aydinlik,
      }),
      say("ayaklarım buz kesti. ıslak çoraplar taş gibi", {
        if: is.flag("islak_kiyafet"),
      }),
      say("derenin oraya doğru bir şey var", { delay: "6s" }),
      say("kardan bir çubuk çıkıyor gibi"),
    ],
    choices: [
      choice("Yavaş git. Her adımda önünü yokla.", "g1_disari_yavas"),
      choice("Koş, bak ve hemen dön!", "g1_burkulma"),
      choice("Bırak, geri dön. Değmez.", "g1_disari_vazgec"),
    ],
  }),

  node("g1_disari_yavas", {
    day: 1,
    steps: [
      say("tamam. yavaş"),
      say("adım", { delay: "4s" }),
      say("adım", { delay: "4s" }),
    ],
    next: [
      { if: is.flag("islak_kiyafet"), to: "g1_baton_kayma" },
      { to: "g1_baton" },
    ],
  }),

  node("g1_baton", {
    day: 1,
    title: "Baton",
    onEnter: [fx.give("ozan_batonu"), fx.set("ozan_izi"), fx.stat("moral", +5)],
    steps: [
      say("buldum", { delay: "5s" }),
      say("baton. ozanın batonu"),
      say("tutacağına kırmızı bant sarmıştı, kesin onun"),
      say("ortadan kırılmış"),
      say("ozan buradan geçmiş. en azından buraya kadar gelmiş"),
      say("alıyorum. dönüyorum"),
      say("içerdeyim", { delay: "6s" }),
    ],
    next: "g1_disari_sonra",
  }),

  node("g1_baton_kayma", {
    day: 1,
    title: "Baton",
    onEnter: [
      fx.give("ozan_batonu"),
      fx.set("ozan_izi"),
      fx.injure("burkulmus_ayak"),
      fx.stat("saglik", -8),
      fx.stat("isi", -3),
    ],
    steps: [
      say("ayaklarımı hissetmiyorum", { delay: "6s" }),
      say("ama buldum. ozanın batonu. kırmızı bantlı olan"),
      say("ortadan kırık"),
      say(
        "dönerken ayağım bir taşa takıldı. hissetmediğim için göremedim bile",
        { delay: "10s" },
      ),
      say("bileğim kötü döndü"),
      say("topallayarak geldim. içerdeyim"),
    ],
    next: "g1_disari_sonra",
  }),

  node("g1_burkulma", {
    day: 1,
    title: "Burkulma",
    onEnter: [
      fx.injure("burkulmus_ayak"),
      fx.stat("saglik", -10),
      fx.stat("moral", -5),
    ],
    steps: [
      say("koşuyorum"),
      say("düştüm", { delay: "6s" }),
      say("ayağım iki kayanın arasına girdi"),
      say("bileğim", { delay: "4s" }),
      say("çok kötü döndü"),
      say("çubuk neymiş bakamadım bile. kar örttü"),
      say("sürünerek döndüm sayılır", { delay: "8s" }),
    ],
    next: "g1_disari_sonra",
  }),

  node("g1_disari_vazgec", {
    day: 1,
    onEnter: [fx.stat("moral", +2)],
    steps: [
      say("tamam"),
      say("dönüyorum"),
      say("belki bir dal parçasıydı", { delay: "6s" }),
      say("belki değildi"),
      say("bunu hep düşüneceğim"),
    ],
    next: "g1_disari_sonra",
  }),

  node("g1_disari_ipli", {
    day: 1,
    title: "İple dışarı",
    onEnter: [
      fx.set("disari_cikti_gece"),
      fx.stat("isi", -6),
      fx.stat("pil", -2),
      fx.give("ozan_batonu"),
      fx.set("ozan_izi"),
      fx.stat("moral", +5),
    ],
    steps: [
      say("ipi kapının demir halkasına bağladım. ucunu belime"),
      say("ozandan öğrendiğim tek düğüm. umarım doğru hatırlıyorum"),
      say("çıktım", { delay: "10s" }),
      say(
        "kafa lambası iki metre ötesini gösteriyor. ama ip gergin, ev arkamda",
        { if: karanlik },
      ),
      say("her şey beyaz. ama ip gergin, ev arkamda biliyorum", {
        if: aydinlik,
      }),
      say("derenin başında bir şey var. kardan çıkmış", { delay: "8s" }),
      say("baton"),
      say("ozanın batonu. kırmızı bantlı. ortadan kırık"),
      say("ipi takip ederek döndüm. içerdeyim", { delay: "10s" }),
    ],
    next: "g1_disari_sonra",
  }),

  node("g1_disari_sonra", {
    day: 1,
    onEnter: [fx.stat("isi", +4)],
    steps: [
      say("sobanın önüne çöktüm"),
      say("bileğim şişiyor. botu çıkardım, bir daha giremeyecek gibi", {
        if: is.injury("burkulmus_ayak"),
      }),
      say("batonu kucağımda tutuyorum. saçma ama sanki onu tutuyorum", {
        if: is.item("ozan_batonu"),
      }),
      say("ip iyi fikirdi. yalnız çıkmadım gibi hissettim", {
        if: is.visited("g1_disari_ipli"),
      }),
      say('bu arada özür dilerim. "seni tanımıyorum bile" dedim', {
        if: is.visited("g1_kal_dinlemez"),
      }),
      say("tanımıyorum ama. bu gece burda benimle bir tek sen varsın", {
        if: is.visited("g1_kal_dinlemez"),
      }),
    ],
    next: "g1_rota",
  }),

  node("g1_rota", {
    day: 1,
    title: "Dere",
    steps: [
      say("ozan nereye gitmiş olabilir", { delay: "5s" }),
      say("dere aşağı iniyor. o da onu takip etti, eminim"),
      say("harita olsa bakardım. ama haritayı sobaya verdim", {
        if: is.flag("harita_yakildi"),
      }),
    ],
    choices: [
      choice("Haritaya bak, dere aşağıda nereye çıkıyor?", "g1_harita_bak", {
        requires: is.item("harita"),
        lockedReason: "Haritan yok, sobada yandı.",
      }),
      choice("Düdüğünü kapıdan çal. Belki duyar.", "g1_duduk"),
      choice("Şimdilik bırak. Önce ısınman lazım.", "g1_pil", {
        effects: [fx.stat("isi", +3)],
      }),
    ],
  }),

  node("g1_harita_bak", {
    day: 1,
    onEnter: [fx.stat("moral", +3)],
    steps: [
      say("açtım", { delay: "5s" }),
      say("dere aşağıda iki kilometre kadar sonra bir köprüye iniyor"),
      say("köprünün yanında küçük bir kare var. çoban kulübesi işareti"),
      say("ozan oraya gitmiş olabilir. sinyal de orda çekebilir"),
      say("bunu aklımda tutuyorum"),
    ],
    next: "g1_pil",
  }),

  node("g1_duduk", {
    day: 1,
    onEnter: [fx.stat("isi", -2)],
    steps: [
      say("kapıyı araladım", { delay: "3s" }),
      say("topallayarak gittim ama gittim", {
        if: is.injury("burkulmus_ayak"),
      }),
      say("üç kere çaldım. uzun uzun", { delay: "5s" }),
      say("hiçbir şey. sadece rüzgar", { delay: "8s" }),
      say("bir daha çaldım. yok", { delay: "6s" }),
      say("ama en azından bir şey yaptım"),
    ],
    next: "g1_pil",
  }),

  // ---------------------------------------------------------------------------
  // 10. Pil kararı
  // ---------------------------------------------------------------------------
  node("g1_pil", {
    day: 1,
    title: "Pil",
    onEnter: [fx.stat("pil", -2)],
    steps: [
      system("Pil zayıf", { tone: "warning", delay: "2s" }),
      say("pil düşüyor"),
      say("%30’un altına indi. powerbank boş, denedim"),
      say("açık tutarsam yarına bir şey kalmaz"),
      say("ama kapatırsam ve ozan yazarsa..."),
      say("ya da sen yazarsan"),
    ],
    choices: [
      choice("Kapat. Açtığında ben yine burada olacağım.", "g1_pil_kapat"),
      choice("Açık bırak, Ozan’dan haber gelirse kaçırma.", "g1_pil_acik"),
      choice("Bana güven. Kapat, ilk iş bana yaz.", "g1_pil_guven", {
        requires: is.stat("moral", { gte: 60 }),
        lockedReason: "Deniz sana henüz o kadar güvenmiyor.",
      }),
    ],
  }),

  node("g1_pil_kapat", {
    day: 1,
    steps: [pause("2s")],
    // Güven düşükse Deniz telefonu kapatmayı reddeder (Ozan'dan umudunu kesemez)
    next: [{ if: inatci, to: "g1_pil_inat" }, { to: "g1_pil_tamam" }],
  }),

  node("g1_pil_tamam", {
    day: 1,
    onEnter: [fx.set("pil_tasarrufu"), fx.stat("moral", +3)],
    steps: [
      say("tamam"),
      say("tasarruf modunu açtım. ekran loş, ses kapalı"),
      say("uyurken de kapatacağım. bu konuda sana güveniyorum"),
    ],
    next: "g1_gun_sonu",
  }),

  node("g1_pil_inat", {
    day: 1,
    onEnter: [fx.stat("pil", -5)],
    steps: [
      say("emin misin?"),
      say("yok", { delay: "3s" }),
      say("kapatmayacağım. ya ozan yazarsa ve ben görmezsem"),
      say("sana kızgın değilim. sadece yapamam"),
    ],
    next: "g1_gun_sonu",
  }),

  node("g1_pil_acik", {
    day: 1,
    onEnter: [fx.stat("pil", -6), fx.stat("moral", +2)],
    steps: [
      say("evet"),
      say("açık kalsın. ekranı en kısığa aldım en azından"),
      say("belki bir mesaj gelir. belki ondan"),
    ],
    next: "g1_gun_sonu",
  }),

  node("g1_pil_guven", {
    day: 1,
    onEnter: [fx.set("pil_tasarrufu"), fx.stat("moral", +5)],
    steps: [
      say("tamam Frekans"),
      say("sana güveniyorum"),
      say("bu cümleyi bir yabancıya yazacağım hiç aklıma gelmezdi", {
        delay: "3s",
      }),
    ],
    next: "g1_gun_sonu",
  }),

  // ---------------------------------------------------------------------------
  // 11. Gün sonu (gerçek saate bağlı) + kapıdaki ses
  // ---------------------------------------------------------------------------
  node("g1_gun_sonu", {
    day: 1,
    title: "Gün sonu",
    steps: [say("çok yoruldum", { delay: "3s" }), say("gözlerim yanıyor")],
    next: [
      { if: is.between("17:00", "06:00"), to: "g1_uyku" },
      { to: "g1_aksam_ara" },
    ],
  }),

  node("g1_aksam_ara", {
    day: 1,
    title: "Akşama kadar",
    steps: [
      say("bak, şöyle yapalım"),
      say("pil için kapatıyorum, akşam 8’de açarım"),
      say(
        "açık tutacaktım ama akşama kadar kapalı kalsın. sonra açık bırakırım",
        {
          if: is.not(is.flag("pil_tasarrufu")),
        },
      ),
      say(
        "o saatte burası zifiri karanlık olur. o zaman seninle konuşmak istiyorum",
      ),
      say("8’de. söz"),
      away({ until: "20:00", notice: "Deniz’in telefonu kapandı" }),
    ],
    next: "g1_aksam",
  }),

  node("g1_aksam", {
    day: 1,
    title: "Akşam",
    steps: [
      say("açtım"),
      say("8 oldu mu? oldu"),
      system("Sinyal zayıf", { tone: "warning" }),
      say("hava karardı. pencerede kendi yansımamdan başka bir şey yok"),
      say("bütün gün sobaya baktım. ozanı düşündüm. annemi düşündüm"),
      say("telefonu açıp sana yazmamak için kendimi zor tuttum"),
      say("bir ara dışarıdan kuş sesi geldi. bu fırtınada kuş ne arar", {
        delay: "3s",
      }),
      say("batonu kapının yanına dayadım. ozan gelince görsün diye", {
        if: is.item("ozan_batonu"),
      }),
      say("elim hala zonkluyor. bezi değiştirmedim, korkuyorum bakmaya", {
        if: yanik,
      }),
      say("bileğim mosmor oldu", { if: is.injury("burkulmus_ayak") }),
      say("korkum bu biliyor musun", { delay: "4s" }),
      say("karanlıkta yalnız kalmak"),
      say("küçükken de böyleydi. koridorun ışığı açık uyurdum"),
    ],
    choices: [
      choice("Yalnız değilsin. Ben buradayım.", "g1_aksam_yakin", {
        effects: [fx.stat("moral", +5)],
      }),
      choice("Bana yarın ilk ne yapacağını anlat.", "g1_aksam_plan", {
        effects: [fx.stat("moral", +2)],
      }),
    ],
  }),

  node("g1_aksam_yakin", {
    day: 1,
    steps: [
      say("biliyorum"),
      say("yani biliyorum ama bir de senden duymak iyi geldi"),
      say("bu gece koridor ışığı sensin", { delay: "3s" }),
      say("ama ekranı kısık tutacağım. ışık az, pil çok"),
    ],
    next: "g1_uyku",
  }),

  node("g1_aksam_plan", {
    day: 1,
    steps: [
      say("yarın..."),
      say("odun. su. evin etrafına bakmak"),
      say("ozanın izini aramak"),
      say("liste yapınca daha iyi hissediyorum. metin yazarlığı hastalığı"),
      say("madde dört: kurtulunca sana bir çay borcum var"),
    ],
    next: "g1_uyku",
  }),

  node("g1_uyku", {
    day: 1,
    title: "İyi geceler",
    steps: [
      say("hava kararıyor. erken ama gözlerim kapanıyor", {
        if: is.between("17:00", "18:30"),
      }),
      say("dışarısı tamamen karardı", {
        if: is.all(
          is.between("18:30", "22:00"),
          is.not(is.visited("g1_aksam")),
        ),
      }),
      say("saat geç oldu", { if: is.between("22:00", "04:00") }),
      say("sabah olacak neredeyse. bir iki saat uyusam yeter", {
        if: is.between("04:00", "07:00"),
      }),
      say("sobaya iki kütük daha attım"),
      say("bu soba sabaha kadar yanmalı. kibrit yok", {
        if: is.flag("kibrit_bitti"),
      }),
      say("uyumaya çalışacağım. sabah yazarım"),
      say("konumum sende. bu bile iyi geliyor", {
        if: is.flag("konum_gonderildi"),
      }),
      say("sıcak odanda iyi uyu", { if: is.flag("oyuncu_tanisti") }),
      say("kim olduğunu bilmiyorum ama iyi ki varsın", {
        if: is.flag("oyuncu_gizemli"),
      }),
      say("iyi geceler Frekans"),
    ],
    next: "g1_kapi",
  }),

  node("g1_kapi", {
    day: 1,
    title: "Kapıdaki ses",
    onEnter: [fx.set("kapi_sesi")],
    steps: [
      say("dur", { delay: "6s" }),
      say("biri kapıya vurdu galiba"),
      say("üç kere", { delay: "4s" }),
      say("rüzgar değil bu. rüzgar böyle vurmaz"),
    ],
    choices: [
      choice("Açma! Önce kim olduğunu sor.", "g1_kapi_sor"),
      choice("Belki Ozan’dır! Bak!", "g1_kapi_bak"),
      choice("Ses çıkarma. Işığı söndür, bekle.", "g1_kapi_sessiz"),
    ],
  }),

  // Üç sonda da kapı AÇILMAZ: Gün 2 (g2_sabah) sabah kapıyı açmaya korkan Deniz'le başlar.
  node("g1_kapi_sor", {
    day: 1,
    chapterEnd: "Gün 1 — Sinyal",
    steps: [
      say("kim var orda diye bağırdım"),
      say("ses yok", { delay: "8s" }),
      say("sadece rüzgar. bir de"),
      say("kapının dibinde bir şey sürtünüyor sanki", { delay: "3s" }),
      say("aşağı doğru. sonra durdu"),
      say("bu kapıyı sabaha kadar açmıyorum"),
      say("telefonu kapatıyorum. ışığı görünmesin", {
        if: is.flag("pil_tasarrufu"),
      }),
      say("pil gidiyor, ekran titriyor", {
        if: is.not(is.flag("pil_tasarrufu")),
      }),
      sleepUntil("08:00", { notice: "Deniz’in telefonu kapandı" }),
    ],
    next: "g2_sabah",
  }),

  node("g1_kapi_bak", {
    day: 1,
    chapterEnd: "Gün 1 — Sinyal",
    steps: [
      say("ozan?"),
      say('"ozan sen misin" diye bağırdım', { delay: "3s" }),
      say("cevap yok", { delay: "5s" }),
      say("kapıya gidiyorum"),
      say("topallıyorum ama gidiyorum", { if: is.injury("burkulmus_ayak") }),
      say("mandal donmuş. açılmıyor", { delay: "6s" }),
      say("omzumla yükleniyorum"),
      say("bir daha vurdu", { delay: "4s" }),
      say("tam elimin altında. kapının öbür tarafında bir şey var"),
      say("nefes gibi bir", { delay: "3s" }),
      sleepUntil("08:00", { delay: "1s", notice: "Deniz’in telefonu kapandı" }),
    ],
    next: "g2_sabah",
  }),

  node("g1_kapi_sessiz", {
    day: 1,
    chapterEnd: "Gün 1 — Sinyal",
    steps: [
      say("tamam"),
      say("yaktığım mumu üfledim. sobanın kapağını kapattım", { delay: "4s" }),
      say("karanlık", { delay: "3s" }),
      say("en sevmediğim şey"),
      say("bir daha vurmadı", { delay: "10s" }),
      say("ama gitmedi de. kapının önünde kar gıcırdıyor"),
      say("sabaha kadar böyle oturabilirim. ses çıkarmadan"),
      say("telefonu kapatıyorum. ekranın ışığı da görünmesin"),
      sleepUntil("08:00", { notice: "Deniz’in telefonu kapandı" }),
    ],
    next: "g2_sabah",
  }),
];

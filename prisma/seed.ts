import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function upsertUser(data: {
  email: string
  name: string
  password: string
  role: "ADMIN" | "APPLICANT" | "JURY"
  extra?: Record<string, unknown>
}) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } })
  if (existing) {
    console.log(`[seed] Mevcut: ${data.email}`)
    return existing
  }
  const passwordHash = await bcrypt.hash(data.password, 12)
  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      passwordHash,
      role: data.role,
      onboardingCompleted: true,
      ...data.extra,
    },
  })
  console.log(`[seed] Oluşturuldu (${data.role}): ${data.email}`)
  return user
}

async function main() {
  const now = new Date()
  const DAY = 86_400_000

  // ══════════════════════════════════════════════════════════════
  // 1. KULLANICILAR
  // ══════════════════════════════════════════════════════════════

  const admin = await upsertUser({
    email: "admin@divizyon.com",
    name: "Burakcan Karaman",
    password: "Admin1234!",
    role: "ADMIN",
  })

  // Tek başvurucu
  const applicant = await upsertUser({
    email: "tyerdekalmazer01@gmail.com",
    name: "Taha Yerdekalmazer",
    password: "Test1234!",
    role: "APPLICANT",
    extra: {
      phone: "+90 532 111 22 33",
      educationStatus: "Lisans Öğrencisi",
      department: "Bilgisayar Mühendisliği",
      address: "İstanbul",
      communityProfileUrl: "https://divizyon.org/tahayerdekalmazer",
      linkedinUrl: "https://linkedin.com/in/tahayerdekalmazer",
    },
  })

  // 2 jüri üyesi
  const jury1 = await upsertUser({
    email: "prof.celik@divizyon.com",
    name: "Prof. Dr. Hasan Çelik",
    password: "Test1234!",
    role: "JURY",
    extra: {
      juryTitle: "Profesör",
      juryOrganization: "Boğaziçi Üniversitesi",
      juryExpertise: ["Teknoloji/Girişimcilik", "İnovasyon Yönetimi"],
      juryBio: "20 yıllık teknoloji girişimciliği deneyimi. Açık inovasyon ve ekosistem yönetimi konularında çok sayıda yayın ve danışmanlık.",
      juryActive: true,
    },
  })

  const jury2 = await upsertUser({
    email: "selin.yilmaz@divizyon.com",
    name: "Selin Yılmaz",
    password: "Test1234!",
    role: "JURY",
    extra: {
      juryTitle: "Küratör & Sanat Yönetmeni",
      juryOrganization: "İstanbul Modern",
      juryExpertise: ["Sanat/Kültürel/İçerik", "Sosyal Etki"],
      juryBio: "Çağdaş sanat, dijital kültür ve topluluk odaklı sanat projeleri alanında 15 yıllık deneyim.",
      juryActive: true,
    },
  })

  // ══════════════════════════════════════════════════════════════
  // 2. BAŞVURU DÖNEMLERİ
  // ══════════════════════════════════════════════════════════════

  const activePeriod = await prisma.applicationPeriod.upsert({
    where: { id: "seed-period-active" },
    update: {},
    create: {
      id: "seed-period-active",
      title: "2025 Bahar Mikro Destek Dönemi",
      startDate: new Date(now.getTime() - 20 * DAY),
      endDate: new Date(now.getTime() + 15 * DAY),
      status: "ACTIVE",
    },
  })

  const closedPeriod = await prisma.applicationPeriod.upsert({
    where: { id: "seed-period-closed" },
    update: {},
    create: {
      id: "seed-period-closed",
      title: "2024 Güz Mikro Destek Dönemi",
      startDate: new Date(now.getTime() - 120 * DAY),
      endDate: new Date(now.getTime() - 60 * DAY),
      status: "CLOSED",
    },
  })

  console.log("[seed] Dönemler oluşturuldu")

  // ══════════════════════════════════════════════════════════════
  // 3. PROGRAMLAR
  // ══════════════════════════════════════════════════════════════

  const activeProgram = await prisma.program.upsert({
    where: { id: "seed-program-active" },
    update: {},
    create: {
      id: "seed-program-active",
      title: "2025 Teknoloji & Girişimcilik Programı",
      startDate: new Date(now.getTime() - 30 * DAY),
      endDate: new Date(now.getTime() + 60 * DAY),
      status: "ACTIVE",
    },
  })

  const closedProgram = await prisma.program.upsert({
    where: { id: "seed-program-closed" },
    update: {},
    create: {
      id: "seed-program-closed",
      title: "2024 Sosyal Etki Programı",
      startDate: new Date(now.getTime() - 150 * DAY),
      endDate: new Date(now.getTime() - 30 * DAY),
      status: "CLOSED",
    },
  })

  console.log("[seed] Programlar oluşturuldu")

  // ══════════════════════════════════════════════════════════════
  // 4. BAŞVURULAR (5 farklı türde, gerçekçi içerikle)
  // ══════════════════════════════════════════════════════════════

  // ── APP 1: DRAFT — Teknoloji projesi, taslak aşamasında ──
  const app1 = await prisma.application.upsert({
    where: { id: "seed-app-1-draft" },
    update: {},
    create: {
      id: "seed-app-1-draft",
      title: "EcoTrack — Karbon Ayak İzi Takip Uygulaması",
      status: "DRAFT",
      userId: applicant.id,
      periodId: activePeriod.id,
      programId: activeProgram.id,
      categories: ["Teknoloji/Girişimcilik"],
      technologyStage: "MVP",
      teamName: "EcoTrack Ekibi",
      summary: "Bireylerin günlük aktivitelerindeki karbon ayak izini ölçen, alternatif sürdürülebilir seçenekler öneren ve topluluk bazlı ödül sistemiyle davranış değişikliği teşvik eden mobil uygulama.",
      teamInfo: "Elif Kaya — Full-stack Developer & Proje Lideri — elif.kaya@email.com\nAli Yıldız — UI/UX Tasarımcı — ali.yildiz@email.com",
      targetAudience: "18-35 yaş arası çevre bilincine sahip kentli bireyler, üniversite öğrencileri ve kurumsal sürdürülebilirlik hedefleri olan şirket çalışanları.",
      problemStatement: "Bireylerin günlük yaşamlarında ne kadar karbon salınımına neden olduklarını somut olarak görebilecekleri, kullanımı kolay bir araç bulunmamaktadır. Mevcut karbon hesaplayıcılar genellikle yılllık tahminlere dayalı, interaktif olmayan ve davranış değişikliği için motivasyon sağlamayan statik araçlardır.",
      solution: "EcoTrack, kullanıcının ulaşım, beslenme, enerji tüketimi ve alışveriş alışkanlıklarını izleyerek günlük, haftalık ve aylık karbon ayak izi raporu oluşturur. Yapay zeka destekli öneri motoru kişiselleştirilmiş alternatifler sunar.",
      innovation: "Gamification ve topluluk bazlı yaklaşım: Kullanıcılar mahalle/şehir bazında takımlar oluşturarak kolektif hedeflere ulaşır. Her azaltım aksiyonu için 'Yeşil Puan' kazanılır ve yerel işletmelerde indirim olarak kullanılır.",
      supportTypes: ["Yazılım ve Teknik Araç Desteği", "Mentorluk ve Uzmanlık Desteği"],
    },
  })

  // ── APP 2: SUBMITTED — Sanat/Kültürel proje, gönderilmiş ──
  const app2 = await prisma.application.upsert({
    where: { id: "seed-app-2-submitted" },
    update: {},
    create: {
      id: "seed-app-2-submitted",
      title: "Sesli Hafıza — İstanbul'un Kaybolan Sesleri Arşivi",
      status: "SUBMITTED",
      submittedAt: new Date(now.getTime() - 4 * DAY),
      userId: applicant.id,
      periodId: activePeriod.id,
      teamName: "Sesli Hafıza Ekibi",
      categories: ["Sanat/Kültürel/İçerik", "Araştırma/Akademik"],
      artStage: "Üretimde",
      researchStage: "Veri Toplama",
      summary: "İstanbul'un değişen ses peyzajını belgelemek ve gelecek nesillere aktarmak amacıyla sokak satıcıları, zanaat atölyeleri, tarihi mekanlar ve mahalle kültürüne ait sesleri kaydedip interaktif bir dijital harita üzerinde sunan ses arşivi projesi.",
      teamInfo: "Mert Özdemir — Ses Tasarımcı & Proje Lideri — mert@email.com\nZehra Aktaş — Görsel Tasarımcı — zehra@email.com\nDeniz Korkmaz — Alan Araştırmacı — deniz@email.com",
      targetAudience: "Kültürel miras araştırmacıları, ses sanatçıları, kentsel dönüşüm süreçleriyle ilgilenen sivil toplum kuruluşları, İstanbul tarihi ile ilgilenen yerli ve yabancı ziyaretçiler.",
      problemStatement: "İstanbul'un hızlı kentsel dönüşümü sonucunda onlarca yıldır şehrin kimliğini oluşturan sesler — bozacı sesleri, bakırcı çekiçleri, vapur düdükleri, çarşı uğultusu — giderek kayboluyor. Bu sesler herhangi bir sistematik arşivleme çalışması yapılmadan yok olmaktadır.",
      solution: "Profesyonel alan kayıt ekipmanlarıyla İstanbul'un 15 farklı semtinde 200+ benzersiz ses kaydı toplanacak. Her kayıt GPS koordinatı, tarih, bağlam açıklaması ve görsel materyalle birlikte interaktif web haritasına entegre edilecek.",
      innovation: "Geleneksel arşivleme yöntemlerinden farklı olarak, proje katılımcı bir yapıda tasarlanmıştır. Web platformu üzerinden İstanbullular kendi ses kayıtlarını yükleyebilir, eski anılarını paylaşabilir. Böylece kolektif bir hafıza inşa edilir.",
      outputs: "200+ profesyonel ses kaydı, interaktif web haritası, 15 semtten görsel-işitsel belgesel serisi, açık kaynak ses veritabanı (Creative Commons lisansı ile).",
      timeline: "1. Ay: Ekipman temini ve pilot kayıtlar (3 semt)\n2-3. Ay: Yoğun alan çalışması (12 semt)\n4. Ay: Post-prodüksiyon ve web platformu geliştirme\n5. Ay: Beta yayın ve topluluk katılımı\n6. Ay: Lansman sergisi ve açık erişim",
      successCriteria: "200+ ses kaydı arşivlenmesi, web platformunda 10.000+ tekil ziyaretçi, en az 50 topluluk katkılı ses kaydı, 1 ulusal medya haberi, 2 akademik konferansta sunum.",
      ecosystemCollaboration: "Divizyon bünyesindeki ses mühendisleri ve içerik üreticileriyle ortak kayıt seansları planlanmaktadır. Alliance Partner'lardan mekan ve ekipman desteği talep edilecektir.",
      communityContribution: "Aylık dinleti etkinlikleri düzenlenecek, topluluk üyeleri alan çalışmalarına katılabilecek. Kayıt teknikleri atölyesi verilecek.",
      divisionContribution: "Proje, Divizyon'un kültürel miras ve dijital arşivleme alanındaki görünürlüğünü uluslararası düzeyde artıracaktır. UNESCO Somut Olmayan Kültürel Miras bağlamında referans çalışma potansiyeli taşır.",
      supportTypes: ["Üretim ve Altyapı Desteği", "Materyal ve Envanter Desteği", "Görünürlük ve Ağ Desteği", "Akademik Üretim Desteği"],
    },
  })

  // ── APP 3: IN_REVIEW — Araştırma projesi, jüriye atanmış ──
  const app3 = await prisma.application.upsert({
    where: { id: "seed-app-3-inreview" },
    update: {},
    create: {
      id: "seed-app-3-inreview",
      title: "Açık Veri ile Mahalle Eşitsizlik Haritası",
      status: "IN_REVIEW",
      submittedAt: new Date(now.getTime() - 12 * DAY),
      presentationDate: new Date(now.getTime() + 5 * DAY),
      userId: applicant.id,
      periodId: activePeriod.id,
      programId: activeProgram.id,
      teamName: "VeriHarita Ekibi",
      categories: ["Araştırma/Akademik", "Teknoloji/Girişimcilik"],
      researchStage: "Analiz",
      technologyStage: "Doğrulama",
      summary: "Türkiye genelinde açık veri kaynaklarını (TÜİK, belediye verileri, coğrafi bilgi sistemleri) birleştirerek mahalle düzeyinde sosyo-ekonomik eşitsizlikleri görselleştiren interaktif bir veri platformu geliştirme projesi.",
      teamInfo: "Ayşe Demir — Araştırmacı & Proje Lideri — ayse@email.com\nCan Bulut — Veri Bilimci — can@email.com\nSema Yıldırım — Coğrafi Bilgi Sistemi Uzmanı — sema@email.com",
      targetAudience: "Belediye planlama birimleri, sivil toplum kuruluşları, akademisyenler, veri gazetecileri ve kentsel politika yapıcıları.",
      problemStatement: "Türkiye'de kentsel eşitsizlikler il düzeyinde raporlanmakta ancak mahalle düzeyinde veri erişimi son derece kısıtlıdır. Karar vericiler ve araştırmacılar mikro ölçekli eşitsizlikleri tespit edemiyor, politikalar makro düzeyde kalıyor.",
      solution: "Platform, TÜİK mikro veri setleri, belediye açık verileri ve uydu görüntülerini yapay zeka ile birleştirerek gelir, eğitim, sağlık erişimi, yeşil alan ve ulaşım kalitesi gibi 12 farklı göstergede mahalle bazlı eşitsizlik indeksi üretir.",
      innovation: "Makine öğrenmesi ile farklı granülaritedeki verilerin birleştirilmesi (data fusion), Türkiye'de ilk kez mahalle düzeyinde çok boyutlu eşitsizlik indeksinin oluşturulması, ve bu verinin açık API ile herkesin erişimine sunulması.",
      outputs: "İnteraktif web platformu, 81 il — 5000+ mahalle verisi, açık API, metodoloji raporu, 2 hakemli makale taslağı.",
      timeline: "1. Ay: Veri toplama ve temizleme\n2. Ay: Makine öğrenmesi model geliştirme\n3. Ay: Platform frontend geliştirme\n4. Ay: Pilot il (İstanbul) lansmanı\n5-6. Ay: 81 ile genişleme ve akademik yayın",
      successCriteria: "5000+ mahalle verisi, platform lansmanı, 5000+ aylık aktif kullanıcı, 2 belediyeyle pilot işbirliği, 1 hakemli dergide yayın kabulü.",
      ecosystemCollaboration: "Divizyon'daki veri bilimciler ve yazılımcılarla sprint bazlı çalışmalar planlanmaktadır. Alliance Partner üniversitelerden akademik danışmanlık alınacaktır.",
      communityContribution: "Açık veri okuryazarlığı atölyeleri düzenlenecek, topluluk üyeleri kendi mahallelerinin analizine katkı sağlayabilecek. Veri hikayeciliği workshop'u verilecek.",
      divisionContribution: "Proje, Divizyon'un veri odaklı sosyal etki alanındaki konumunu güçlendirecek. Açık veri ekosistemi için referans platform olma potansiyeli taşır.",
      supportTypes: ["Yazılım ve Teknik Araç Desteği", "Akademik Üretim Desteği", "Mentorluk ve Uzmanlık Desteği"],
    },
  })

  // ── APP 4: EVALUATED — Topluluk projesi, karar bekliyor ──
  const app4 = await prisma.application.upsert({
    where: { id: "seed-app-4-evaluated" },
    update: {},
    create: {
      id: "seed-app-4-evaluated",
      title: "Komşu Mutfağı — Gıda İsrafını Önleme Platformu",
      status: "EVALUATED",
      submittedAt: new Date(now.getTime() - 30 * DAY),
      userId: applicant.id,
      periodId: closedPeriod.id,
      programId: closedProgram.id,
      teamName: "Komşu Mutfağı Ekibi",
      categories: ["Teknoloji/Girişimcilik"],
      technologyStage: "Büyüme",
      summary: "Mahalle sakinlerinin evlerinde artan yemekleri ve son kullanma tarihi yaklaşan gıda ürünlerini komşularıyla paylaşmalarını sağlayan, gamification destekli lokasyon bazlı mobil platform.",
      teamInfo: "Elif Kaya — Backend Developer — elif@email.com\nOğuz Çetin — Mobile Developer — oguz@email.com\nMerve Aksoy — Sosyal Girişimcilik Danışmanı — merve@email.com",
      targetAudience: "Gıda israfına duyarlı kentli bireyler, tek kişilik haneler, öğrenci evleri, mahalle bakkalları ve yerel restoranlar.",
      problemStatement: "Türkiye'de yılda 7.7 milyon ton gıda israf ediliyor. Hane düzeyinde israfın %60'ı pişirilmiş yemek ve son kullanma tarihi yaklaşan ürünlerden kaynaklanıyor. Mevcut bağış platformları büyük ölçekli operasyonlara odaklanıyor, hane içi mikro paylaşım için çözüm bulunmuyor.",
      solution: "Komşu Mutfağı, kullanıcıların artan yemek ve gıda ürünlerini fotoğrafla listelemesini, yakınlarındaki komşuların bu paylaşımları görmesini ve anlık mesajlaşmayla koordine etmesini sağlar. Hijyen kontrol listesi ve kullanıcı puanlama sistemiyle güvenilirlik sağlanır.",
      innovation: "Mahalle bazlı mikro-paylaşım ekonomisi modeli, Türkiye'de ilk. Gamification ile kullanıcılar 'Sıfır İsraf Rozeti' kazanır, mahalleler arası yarışma düzenlenir. AI destekli son kullanma tarihi hatırlatıcı refrigerator scanner özelliği.",
      outputs: "iOS ve Android uygulaması, 500 aktif kullanıcı, 3 pilot mahallede lansman, aylık 2 ton gıda israfı önleme hedefi.",
      timeline: "1. Ay: MVP geliştirme\n2. Ay: 3 pilot mahallede beta test\n3. Ay: Geri bildirim ve iterasyon\n4-5. Ay: İstanbul geneli lansman\n6. Ay: Etki raporu ve ölçekleme planı",
      successCriteria: "500+ aktif kullanıcı, 2 ton/ay gıda israfı önleme, 4.5+ uygulama mağaza puanı, 3+ medya haberi, 1 belediye işbirliği.",
      ecosystemCollaboration: "Divizyon'daki mobil geliştiriciler ve UX tasarımcılarla sprint çalışmaları. Sosyal girişimcilik alanındaki Alliance Partner'larla etki ölçüm metodolojisi geliştirilecek.",
      communityContribution: "Topluluk içi gıda farkındalık etkinlikleri, 'Sıfır İsraf Mutfağı' atölyeleri düzenlenecek. Proje açık kaynak olarak paylaşılacak.",
      divisionContribution: "Divizyon'un sosyal etki ve sürdürülebilirlik alanındaki vizyonunu somutlaştıran bir showcase proje. Medya görünürlüğü ve kurumsal itibar katkısı yüksek.",
      supportTypes: ["Yazılım ve Teknik Araç Desteği", "Mentorluk ve Uzmanlık Desteği", "Görünürlük ve Ağ Desteği", "Dış Temsil ve Seyahat Desteği"],
    },
  })

  // ── APP 5: SUPPORTED — Destek almış, aktif proje ──
  const app5 = await prisma.application.upsert({
    where: { id: "seed-app-5-supported" },
    update: {},
    create: {
      id: "seed-app-5-supported",
      title: "Köprü — Engelli Bireylere Yönelik Erişilebilirlik Haritası",
      status: "SUPPORTED",
      submittedAt: new Date(now.getTime() - 80 * DAY),
      userId: applicant.id,
      periodId: closedPeriod.id,
      programId: closedProgram.id,
      teamName: "Köprü Ekibi",
      categories: ["Teknoloji/Girişimcilik", "Sanat/Kültürel/İçerik"],
      technologyStage: "MVP",
      artStage: "Üretimde",
      summary: "Tekerlekli sandalye kullanıcıları ve görme engelli bireyler için şehirdeki erişilebilir rotaları, mekanları ve hizmetleri haritalayan, topluluk katkılı ve sesli navigasyon destekli mobil uygulama.",
      teamInfo: "Mert Özdemir — UX Designer & Proje Lideri — mert@email.com\nAylin Şen — iOS Developer — aylin@email.com\nEmre Güneş — Erişilebilirlik Danışmanı — emre@email.com",
      targetAudience: "Fiziksel engelli bireyler, görme engelli bireyler, yaşlılar, engelli yakınları, belediye erişilebilirlik birimleri.",
      problemStatement: "Türkiye'de fiziksel engelli bireylerin %78'i şehir içi ulaşımda ciddi güçlükler yaşamaktadır. Kaldırım yükseklikleri, rampa eksiklikleri, asansörsüz metrolar ve erişilebilir tuvalet bilgisi merkezi bir kaynakta bulunmamaktadır.",
      solution: "Köprü uygulaması, crowdsource mantığıyla kullanıcıların erişilebilirlik bilgilerini paylaşmasını sağlar. Yapay zeka destekli fotoğraf analizi ile otomatik erişilebilirlik skoru oluşturulur. Sesli navigasyon, görme engelli kullanıcılar için optimizedir.",
      innovation: "Türkiye'de ilk topluluk katkılı erişilebilirlik haritası. Computer vision ile rampa/merdiven/engel tespiti, kişiselleştirilmiş rota önerileri, belediyelerle API entegrasyonu ile resmi veri akışı.",
      outputs: "iOS ve Android uygulaması, İstanbul pilot (5000+ mekan verisi), açık API, erişilebilirlik denetim kılavuzu, eğitim videoları serisi.",
      timeline: "1-2. Ay: Veri toplama ve AI model eğitimi\n3. Ay: Uygulama geliştirme\n4. Ay: Beta test (İstanbul Avrupa Yakası)\n5. Ay: Tam lansman\n6. Ay: Ankara ve İzmir genişlemesi",
      successCriteria: "5000+ mekan verisi, 2000+ aktif kullanıcı, 3 belediye işbirliği, 1 uluslararası erişilebilirlik konferansında sunum, App Store erişilebilirlik kategorisinde öne çıkarılma.",
      ecosystemCollaboration: "Divizyon'daki mobil geliştiriciler ve AI uzmanlarıyla model eğitimi. Engelli hakları STK'larıyla işbirliği protokolü.",
      communityContribution: "Erişilebilirlik farkındalık atölyeleri, topluluk harita-thon etkinlikleri, engelli bireylerin deneyim paylaşım panelleri.",
      divisionContribution: "Proje, Divizyon'un sosyal sorumluluk ve kapsayıcılık alanındaki liderliğini pekiştirir. Uluslararası erişilebilirlik ödüllerine aday olma potansiyeli.",
      supportTypes: ["Yazılım ve Teknik Araç Desteği", "Mentorluk ve Uzmanlık Desteği", "Görünürlük ve Ağ Desteği", "Dış Temsil ve Seyahat Desteği"],
    },
  })

  console.log("[seed] Başvurular oluşturuldu")

  // ══════════════════════════════════════════════════════════════
  // 5. DOSYALAR
  // ══════════════════════════════════════════════════════════════

  const filesToCreate = [
    { appId: app1.id, name: "karbon_hesaplama_algoritma.pdf", size: 340_000 },
    { appId: app2.id, name: "ses_kayit_ornekleri_katalog.pdf", size: 512_000 },
    { appId: app2.id, name: "proje_butce_plani.xlsx", size: 67_000 },
    { appId: app2.id, name: "ekip_portfolyo.pdf", size: 2_100_000 },
    { appId: app3.id, name: "metodoloji_raporu.pdf", size: 890_000 },
    { appId: app3.id, name: "pilot_veri_seti_istanbul.csv", size: 4_200_000 },
    { appId: app3.id, name: "platform_wireframe.pdf", size: 1_500_000 },
    { appId: app4.id, name: "mvp_sunum.pdf", size: 3_400_000 },
    { appId: app4.id, name: "kullanici_arastirma_raporu.pdf", size: 720_000 },
    { appId: app4.id, name: "gida_israfi_turkiye_verileri.pdf", size: 450_000 },
    { appId: app5.id, name: "uygulama_demo_video_link.pdf", size: 120_000 },
    { appId: app5.id, name: "erisilebilirlik_denetim_kilavuzu.pdf", size: 980_000 },
    { appId: app5.id, name: "beta_test_sonuclari.xlsx", size: 156_000 },
  ]

  for (const f of filesToCreate) {
    const exists = await prisma.file.findFirst({ where: { applicationId: f.appId, name: f.name } })
    if (!exists) {
      await prisma.file.create({
        data: {
          name: f.name,
          url: `http://localhost:9000/mdf-applications/seed/${f.appId}/${f.name}`,
          size: f.size,
          mimeType: f.name.endsWith(".pdf") ? "application/pdf" : f.name.endsWith(".csv") ? "text/csv" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          bucket: "mdf-applications",
          key: `seed/${f.appId}/${f.name}`,
          applicationId: f.appId,
        },
      })
    }
  }
  console.log("[seed] Dosyalar oluşturuldu")

  // ══════════════════════════════════════════════════════════════
  // 6. JÜRİ ATAMALARI
  // ══════════════════════════════════════════════════════════════

  const juryAssignments = [
    { juryId: jury1.id, appId: app3.id },
    { juryId: jury2.id, appId: app3.id },
    { juryId: jury1.id, appId: app4.id },
    { juryId: jury2.id, appId: app4.id },
    { juryId: jury1.id, appId: app5.id },
  ]

  for (const a of juryAssignments) {
    await prisma.juryAssignment.upsert({
      where: { juryId_applicationId: { juryId: a.juryId, applicationId: a.appId } },
      update: {},
      create: { juryId: a.juryId, applicationId: a.appId },
    })
  }
  console.log("[seed] Jüri atamaları oluşturuldu")

  // ══════════════════════════════════════════════════════════════
  // 7. DEĞERLENDİRMELER (7+1 kriter sistemi)
  // ══════════════════════════════════════════════════════════════

  // App4 (EVALUATED) — 2 jüri değerlendirmiş
  for (const { juryId, juryName } of [
    { juryId: jury1.id, juryName: "Hasan Çelik" },
    { juryId: jury2.id, juryName: "Selin Yılmaz" },
  ]) {
    const exists = await prisma.evaluation.findUnique({
      where: { juryId_applicationId: { juryId, applicationId: app4.id } },
    })
    if (!exists) {
      const isJury1 = juryName === "Hasan Çelik"
      await prisma.evaluation.create({
        data: {
          juryId,
          applicationId: app4.id,
          comment: isJury1
            ? "Gıda israfı konusunda somut bir çözüm sunan, ölçeklenebilir bir proje. Teknik altyapı güçlü, topluluk katkısı potansiyeli yüksek. Sürdürülebilirlik modeli için gelir kaynağı planlanmalı."
            : "Topluluk odaklı yaklaşımı çok değerli. Gamification unsurları kullanıcı bağlılığını artıracak nitelikte. Hijyen konusundaki çözüm önerileri güçlendirilebilir.",
          scores: {
            create: [
              { criteria: "innovation",  score: isJury1 ? 4 : 5, justification: isJury1 ? "Mikro gıda paylaşımı konsepti Türkiye'de yenilikçi. Benzer uygulamalardan gamification ile farklılaşıyor." : "Mahalle bazlı yaklaşım ve AI destekli buzdolabı tarama özelliği çok özgün. Topluluk katkılı model ilham verici." },
              { criteria: "feasibility", score: isJury1 ? 4 : 3, justification: isJury1 ? "Ekip deneyimli, MVP aşaması güçlü. Pilot mahalle seçimi stratejik." : "Teknik plan güçlü ancak hijyen kontrolü ve yasal süreçler konusunda daha fazla detay gerekli." },
              { criteria: "community",   score: isJury1 ? 5 : 5, justification: isJury1 ? "Topluluk katkısı doğrudan ve ölçülebilir. Atölye planları ve açık kaynak yaklaşımı mükemmel." : "Sıfır İsraf Mutfağı atölyeleri çok değerli. Topluluk motivasyonunu artıracak güçlü bir yapı." },
              { criteria: "ecosystem",   score: isJury1 ? 4 : 4, justification: isJury1 ? "Sosyal etki yüksek, belediye işbirliği potansiyeli güçlü. Ulusal ölçekleme planı mevcut." : "Gıda bankalarıyla entegrasyon düşünülmüş. Yerel ve ulusal etki potansiyeli yüksek." },
              { criteria: "resource",    score: isJury1 ? 4 : 4, justification: isJury1 ? "Talep edilen destekler projeye uygun ve ölçülü. Mentorluk ihtiyacı doğru tespit edilmiş." : "Kaynaklar gerçekçi planlanmış. Dış temsil desteği ölçekleme için kritik." },
              { criteria: "output",      score: isJury1 ? 4 : 3, justification: isJury1 ? "500 aktif kullanıcı ve 2 ton/ay hedefi somut ve ölçülebilir. Etki raporu planlanmış." : "Hedefler iddialı ama ulaşılabilir. Uzun vadeli sürdürülebilirlik planı güçlendirilebilir." },
              { criteria: "visibility",  score: isJury1 ? 5 : 4, justification: isJury1 ? "Medya ilgisi çekecek bir konu. Divizyon'un sürdürülebilirlik vizyonuyla mükemmel uyum." : "Sosyal medya viral potansiyeli yüksek. Kurumsal itibar katkısı güçlü." },
              { criteria: "bonus",       score: isJury1 ? 4 : 5, justification: isJury1 ? "Sunum materyalleri profesyonel, motivasyon yüksek." : "Anlatım çok tutarlı ve ikna edici. Ekibin tutkusu hissediliyor." },
            ],
          },
        },
      })
    }
  }

  // App5 (SUPPORTED) — 1 jüri değerlendirmiş
  const eval5exists = await prisma.evaluation.findUnique({
    where: { juryId_applicationId: { juryId: jury1.id, applicationId: app5.id } },
  })
  if (!eval5exists) {
    await prisma.evaluation.create({
      data: {
        juryId: jury1.id,
        applicationId: app5.id,
        comment: "Sosyal etkisi çok yüksek, teknik olarak sağlam bir proje. Erişilebilirlik alanında Türkiye'de bir ilk olma potansiyeli taşıyor. Kesinlikle desteklenmeli.",
        scores: {
          create: [
            { criteria: "innovation",  score: 5, justification: "Türkiye'de topluluk katkılı erişilebilirlik haritası ilk. Computer vision ile otomatik erişilebilirlik skoru çok yenilikçi." },
            { criteria: "feasibility", score: 4, justification: "MVP hazır, beta test sonuçları olumlu. Ekip deneyimli ve çeşitli." },
            { criteria: "community",   score: 5, justification: "Harita-thon etkinlikleri ve deneyim paylaşım panelleri topluluk katılımını doğrudan sağlıyor." },
            { criteria: "ecosystem",   score: 5, justification: "Uluslararası erişilebilirlik konferansları ve ödüller için güçlü aday. Belediye işbirlikleri somut." },
            { criteria: "resource",    score: 4, justification: "Talep edilen destekler makul ve projeye doğrudan uygun." },
            { criteria: "output",      score: 5, justification: "5000 mekan verisi ve 2000 aktif kullanıcı hedefi somut. App Store öne çıkarılma potansiyeli yüksek." },
            { criteria: "visibility",  score: 5, justification: "Uluslararası ödül potansiyeli ve medya ilgisi çok yüksek. Divizyon'un sosyal sorumluluk vizyonuyla mükemmel uyum." },
            { criteria: "bonus",       score: 5, justification: "Sunum mükemmel, ekip tutkusu ve motivasyonu üst düzey." },
          ],
        },
      },
    })
  }
  console.log("[seed] Değerlendirmeler oluşturuldu")

  // ══════════════════════════════════════════════════════════════
  // 8. DESTEK KARARI + PROJE
  // ══════════════════════════════════════════════════════════════

  const decision5 = await prisma.supportDecision.findUnique({ where: { applicationId: app5.id } })
  if (!decision5) {
    const dec = await prisma.supportDecision.create({
      data: {
        applicationId: app5.id,
        decidedById: admin.id,
        scope: "PRIORITY",
        notes: "Erişilebilirlik alanında Türkiye'de öncü bir proje. Toplam 38/40 puanla öncelikli destek kapsamında değerlendirildi. Tam destek paketi ve ekosistem entegrasyonu sağlanacaktır.",
        strategicReason: "Köprü projesi, Divizyon'un kapsayıcı teknoloji ve sosyal etki alanındaki stratejik vizyonuyla tam uyum içindedir. Türkiye'de engelli erişilebilirliği alanında öncü bir dijital altyapı oluşturması, uluslararası görünürlük ve kurumsal itibar açısından yüksek değer taşımaktadır.",
        expectedOutputs: "• 5.000+ mekan erişilebilirlik verisi (İstanbul pilot)\n• iOS ve Android uygulaması yayını\n• En az 3 belediye ile resmi işbirliği protokolü\n• 2.000+ aktif kullanıcı\n• 1 uluslararası erişilebilirlik konferansında sunum\n• App Store erişilebilirlik kategorisinde öne çıkarılma",
        supportDuration: "6 ay",
        additionalConditions: "Proje ekibinin aylık ilerleme raporu sunması zorunludur. Açık kaynak yayınlanma taahhüdü proje bitimiyle yerine getirilmelidir. Belediye işbirlikleri için imzalanan protokoller Divizyon'a iletilmelidir.",
        riskFramework: "Veri kalitesi ve crowdsource katkı yoğunluğu konusunda risk mevcuttur. Ekip, gönüllü ağını büyütmekle yükümlüdür. Yasal sorumluluk: kullanıcı tarafından eklenen erişilebilirlik bilgilerinin doğruluğu konusunda sorumluluk reddi beyanı uygulama içinde yer almalıdır.",
      },
    })
    await prisma.project.create({
      data: {
        applicationId: app5.id,
        decisionId: dec.id,
        status: "ACTIVE",
      },
    })
    console.log("[seed] Destek kararı ve proje oluşturuldu (Köprü)")
  }

  // ══════════════════════════════════════════════════════════════
  // 9. PROJE İLERLEME RAPORLARI
  // ══════════════════════════════════════════════════════════════

  const project5 = await prisma.project.findUnique({ where: { applicationId: app5.id } })
  if (project5) {
    const reportCount = await prisma.projectReport.count({ where: { projectId: project5.id } })
    if (reportCount === 0) {
      await prisma.projectReport.createMany({
        data: [
          {
            projectId: project5.id,
            content: "İlk ay çalışmaları tamamlandı. İstanbul'un Avrupa Yakası'nda 1200+ mekan verisi toplandı. Computer vision modeli %87 doğruluk oranına ulaştı. Kadıköy Belediyesi ile işbirliği protokolü imzalandı. Topluluk harita-thon etkinliği için 45 gönüllü kaydoldu.",
            createdAt: new Date(now.getTime() - 30 * DAY),
          },
          {
            projectId: project5.id,
            content: "Beta uygulama yayınlandı, 320 aktif kullanıcıya ulaşıldı. Kullanıcı geri bildirimleri doğrultusunda sesli navigasyon performansı %40 iyileştirildi. Engelli Hakları Derneği ile ortak farkındalık kampanyası başlatıldı. İkinci harita-thon'da 180 yeni mekan eklendi.",
            createdAt: new Date(now.getTime() - 10 * DAY),
          },
        ],
      })
      console.log("[seed] İlerleme raporları oluşturuldu")
    }
  }

  // ══════════════════════════════════════════════════════════════
  // 10. BİLDİRİMLER
  // ══════════════════════════════════════════════════════════════

  const notifCount = await prisma.notification.count()
  if (notifCount === 0) {
    await prisma.notification.createMany({
      data: [
        { userId: applicant.id, title: "Başvurunuz taslak olarak kaydedildi", message: "EcoTrack başvurunuzu tamamlayıp göndermeyi unutmayın.", createdAt: new Date(now.getTime() - 2 * DAY) },
        { userId: applicant.id, title: "Başvurunuz gönderildi", message: "Sesli Hafıza başvurunuz başarıyla alındı. Değerlendirme sürecini takip edebilirsiniz.", createdAt: new Date(now.getTime() - 4 * DAY) },
        { userId: applicant.id, title: "Projeniz desteklendi!", message: "Köprü projeniz Öncelikli Destek kapsamında onaylandı. Proje takibine geçebilirsiniz.", createdAt: new Date(now.getTime() - 40 * DAY) },
        { userId: jury1.id, title: "Yeni değerlendirme ataması", message: "Açık Veri ile Mahalle Eşitsizlik Haritası başvurusu değerlendirmenize atandı.", createdAt: new Date(now.getTime() - 11 * DAY) },
        { userId: jury2.id, title: "Yeni değerlendirme ataması", message: "Açık Veri ile Mahalle Eşitsizlik Haritası başvurusu değerlendirmenize atandı.", createdAt: new Date(now.getTime() - 11 * DAY) },
        { userId: admin.id, title: "Yeni başvuru geldi", message: "Sesli Hafıza başvurusu ön değerlendirme bekliyor.", createdAt: new Date(now.getTime() - 4 * DAY) },
        { userId: admin.id, title: "Değerlendirme tamamlandı", message: "Komşu Mutfağı başvurusu 2 jüri tarafından değerlendirildi. Destek kararı verebilirsiniz.", createdAt: new Date(now.getTime() - 5 * DAY) },
      ],
    })
    console.log("[seed] Bildirimler oluşturuldu")
  }

  // ══════════════════════════════════════════════════════════════
  // ÖZET
  // ══════════════════════════════════════════════════════════════

  console.log("\n╔════════════════════════════════════════════════════════╗")
  console.log("║              SEED TAMAMLANDI — GİRİŞ BİLGİLERİ        ║")
  console.log("╠════════════════════════════════════════════════════════╣")
  console.log("║  ADMIN                                                 ║")
  console.log("║  E-posta : admin@divizyon.com                          ║")
  console.log("║  Şifre   : Admin1234!                                  ║")
  console.log("╠════════════════════════════════════════════════════════╣")
  console.log("║  BAŞVURU SAHİBİ (Taha Yerdekalmazer)                   ║")
  console.log("║  E-posta : tyerdekalmazer01@gmail.com                  ║")
  console.log("║  Şifre   : Test1234!                                   ║")
  console.log("║  • 5 başvuru: DRAFT, SUBMITTED, IN_REVIEW,            ║")
  console.log("║    EVALUATED, SUPPORTED                                ║")
  console.log("╠════════════════════════════════════════════════════════╣")
  console.log("║  JÜRİ 1 (Prof. Dr. Hasan Çelik)                       ║")
  console.log("║  E-posta : prof.celik@divizyon.com                     ║")
  console.log("║  Şifre   : Test1234!                                   ║")
  console.log("╠════════════════════════════════════════════════════════╣")
  console.log("║  JÜRİ 2 (Selin Yılmaz)                                ║")
  console.log("║  E-posta : selin.yilmaz@divizyon.com                   ║")
  console.log("║  Şifre   : Test1234!                                   ║")
  console.log("╚════════════════════════════════════════════════════════╝\n")
}

main()
  .catch((e) => {
    console.error("[seed] Hata:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

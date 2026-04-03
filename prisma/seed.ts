import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function upsertUser(data: {
  email: string
  name: string
  password: string
  role: "ADMIN" | "APPLICANT" | "JURY"
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
    },
  })
  console.log(`[seed] Oluşturuldu (${data.role}): ${data.email}`)
  return user
}

async function main() {
  // ── 1. Kullanıcılar ────────────────────────────────────────
  const admin = await upsertUser({
    email: "admin@divizyon.com",
    name: "Platform Yöneticisi",
    password: "Admin1234!",
    role: "ADMIN",
  })

  const applicant = await upsertUser({
    email: "basvuru@divizyon.com",
    name: "Ahmet Yılmaz",
    password: "Test1234!",
    role: "APPLICANT",
  })

  const jury = await upsertUser({
    email: "juri@divizyon.com",
    name: "Zeynep Kara",
    password: "Test1234!",
    role: "JURY",
  })

  // ── 2. Başvuru Dönemleri ───────────────────────────────────
  const now = new Date()

  const activePeriod = await prisma.applicationPeriod.upsert({
    where: { id: "seed-period-active" },
    update: {},
    create: {
      id: "seed-period-active",
      title: "2025 Q1 Mikro Destek Dönemi",
      startDate: new Date(now.getTime() - 15 * 86_400_000), // 15 gün önce başladı
      endDate: new Date(now.getTime() + 10 * 86_400_000),   // 10 gün sonra bitiyor
      status: "ACTIVE",
    },
  })

  const closedPeriod = await prisma.applicationPeriod.upsert({
    where: { id: "seed-period-closed" },
    update: {},
    create: {
      id: "seed-period-closed",
      title: "2024 Q4 Mikro Destek Dönemi",
      startDate: new Date(now.getTime() - 90 * 86_400_000),
      endDate: new Date(now.getTime() - 30 * 86_400_000),
      status: "CLOSED",
    },
  })

  // ── 3. Başvurular ──────────────────────────────────────────

  // DRAFT — applicant aktif dönemde taslak bırakmış
  const appDraft = await prisma.application.upsert({
    where: { id: "seed-app-draft" },
    update: {},
    create: {
      id: "seed-app-draft",
      title: "Topluluk Kütüphanesi Dijital Kataloğu",
      description:
        "Yerel topluluk kütüphanesinin tüm kitap ve kaynakların dijital ortamda aranabilir hale getirilmesi projesidir. Proje kapsamında QR kod entegrasyonu, mobil uyumlu web arayüzü ve kitap rezervasyon sistemi geliştirilecektir. Hedef kitle mahalle sakinleri ve öğrencilerdir.",
      status: "DRAFT",
      userId: applicant.id,
      periodId: activePeriod.id,
    },
  })

  // SUBMITTED — gönderilmiş, beklemede
  const appSubmitted = await prisma.application.upsert({
    where: { id: "seed-app-submitted" },
    update: {},
    create: {
      id: "seed-app-submitted",
      title: "Mahalle Atık Azaltma Kampanyası",
      description:
        "Mahalledeki geri dönüşüm farkındalığını artırmak ve atık miktarını azaltmak için tasarlanmış sosyal etki projesidir. Kağıt, plastik ve cam ayrıştırma noktaları kurulacak, ilkokul çocuklarına yönelik eğitim atölyeleri düzenlenecektir. Proje 6 ay sürecek olup ilk 3 ayda altyapı kurulumu gerçekleştirilecektir.",
      status: "SUBMITTED",
      submittedAt: new Date(now.getTime() - 3 * 86_400_000),
      userId: applicant.id,
      periodId: activePeriod.id,
    },
  })

  // IN_REVIEW — jüriye atanmış, değerlendirme bekleniyor
  const appInReview = await prisma.application.upsert({
    where: { id: "seed-app-inreview" },
    update: {},
    create: {
      id: "seed-app-inreview",
      title: "Genç Girişimciler Mentorluk Platformu",
      description:
        "18-25 yaş arası genç girişimcileri deneyimli mentorlarla buluşturan dijital bir platform projesidir. Platform eşleştirme algoritması, video görüşme altyapısı ve ilerleme takip paneli içerecektir. İlk etapta 50 mentor ve 200 girişimci hedeflenmektedir. Proje bölgesel istihdam ve inovasyon ekosistemine doğrudan katkı sağlayacaktır.",
      status: "IN_REVIEW",
      submittedAt: new Date(now.getTime() - 10 * 86_400_000),
      userId: applicant.id,
      periodId: activePeriod.id,
    },
  })

  // EVALUATED — değerlendirme tamamlandı, karar bekleniyor
  const appEvaluated = await prisma.application.upsert({
    where: { id: "seed-app-evaluated" },
    update: {},
    create: {
      id: "seed-app-evaluated",
      title: "Kentsel Tarım Eğitim Bahçesi",
      description:
        "Boş arsaları topluluk bahçelerine dönüştürerek kentsel tarım eğitimi verilmesi planlanmaktadır. Sulama sistemleri, kompost alanları ve eğitim pavyonu kurulacaktır. Proje ile 150 kişiye organik tarım eğitimi ve ürün yetiştirme deneyimi kazandırılacaktır.",
      status: "EVALUATED",
      submittedAt: new Date(now.getTime() - 25 * 86_400_000),
      userId: applicant.id,
      periodId: closedPeriod.id,
    },
  })

  // SUPPORTED — desteklendi
  const appSupported = await prisma.application.upsert({
    where: { id: "seed-app-supported" },
    update: {},
    create: {
      id: "seed-app-supported",
      title: "Yaşlı Bakım Gönüllü Ağı",
      description:
        "Mobil gönüllü uygulama ile 65 yaş üstü bireyler için market alışverişi, ilaç takibi ve sosyal refakat hizmetleri sunulmaktadır. Uygulama mahalle bazlı gönüllü havuzu oluşturacak ve koordinasyonu otomatikleştirecektir.",
      status: "SUPPORTED",
      submittedAt: new Date(now.getTime() - 60 * 86_400_000),
      userId: applicant.id,
      periodId: closedPeriod.id,
    },
  })

  // ── 4. Demo Dosyalar (MinIO bağlantısı olmadan UI test için) ─
  const filesToCreate = [
    { appId: appDraft.id, name: "proje_plani.pdf", size: 245_000 },
    { appId: appInReview.id, name: "proje_plani.pdf", size: 312_000 },
    { appId: appInReview.id, name: "butce_tablosu.xlsx", size: 48_000 },
    { appId: appInReview.id, name: "ekip_cv.pdf", size: 180_000 },
    { appId: appEvaluated.id, name: "proje_plani.pdf", size: 290_000 },
    { appId: appEvaluated.id, name: "destekleyici_belge.pdf", size: 95_000 },
    { appId: appSubmitted.id, name: "proje_ozeti.pdf", size: 120_000 },
  ]

  for (const f of filesToCreate) {
    const exists = await prisma.file.findFirst({
      where: { applicationId: f.appId, name: f.name },
    })
    if (!exists) {
      await prisma.file.create({
        data: {
          name: f.name,
          url: `http://localhost:9000/mdf-applications/seed/${f.appId}/${f.name}`,
          size: f.size,
          mimeType: f.name.endsWith(".pdf") ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          bucket: "mdf-applications",
          key: `seed/${f.appId}/${f.name}`,
          applicationId: f.appId,
        },
      })
    }
  }
  console.log("[seed] Dosyalar oluşturuldu")

  // ── 5. Jüri Atamaları ──────────────────────────────────────
  await prisma.juryAssignment.upsert({
    where: { juryId_applicationId: { juryId: jury.id, applicationId: appInReview.id } },
    update: {},
    create: { juryId: jury.id, applicationId: appInReview.id },
  })

  await prisma.juryAssignment.upsert({
    where: { juryId_applicationId: { juryId: jury.id, applicationId: appEvaluated.id } },
    update: {},
    create: { juryId: jury.id, applicationId: appEvaluated.id },
  })
  console.log("[seed] Jüri atamaları oluşturuldu")

  // ── 6. Tamamlanmış Değerlendirme (EVALUATED başvuru için) ──
  const evalExists = await prisma.evaluation.findUnique({
    where: { applicationId: appEvaluated.id },
  })
  if (!evalExists) {
    await prisma.evaluation.create({
      data: {
        juryId: jury.id,
        applicationId: appEvaluated.id,
        comment: "Proje topluluk faydasını net biçimde ortaya koyuyor. Ekip deneyimli görünmekle birlikte sürdürülebilirlik planı güçlendirilebilir.",
        scores: {
          create: [
            { criteria: "innovation",     score: 4, justification: "Kent tarımına teknoloji entegrasyonu yenilikçi bir yaklaşım sunuyor." },
            { criteria: "impact",         score: 5, justification: "150 kişiye doğrudan ulaşma hedefi ve topluluk bahçesi oluşturma etkisi yüksek." },
            { criteria: "feasibility",    score: 3, justification: "Arazi temini ve izin süreçleri risk oluşturuyor; alternatif plan eksik." },
            { criteria: "team",           score: 4, justification: "Ekipte tarım uzmanı ve eğitimci var, proje yönetimi deneyimi yeterli." },
            { criteria: "sustainability", score: 3, justification: "Destek sonrası gelir modeli belirsiz; gönüllü bağımlılığı sürdürülebilirliği kısıtlıyor." },
          ],
        },
      },
    })
    console.log("[seed] Değerlendirme oluşturuldu")
  }

  // ── 7. Destek Kararı + Proje (SUPPORTED başvuru için) ──────
  const decisionExists = await prisma.supportDecision.findUnique({
    where: { applicationId: appSupported.id },
  })
  if (!decisionExists) {
    const decision = await prisma.supportDecision.create({
      data: {
        applicationId: appSupported.id,
        decidedById: admin.id,
        scope: "EXTENDED",
        notes: "Sosyal etki ve ölçeklenebilirlik potansiyeli güçlü. Genişletilmiş destek kapsamında onaylandı.",
      },
    })
    await prisma.project.create({
      data: {
        applicationId: appSupported.id,
        decisionId: decision.id,
        status: "ACTIVE",
      },
    })
    console.log("[seed] Destek kararı ve proje oluşturuldu")
  }

  // ── Özet ──────────────────────────────────────────────────
  console.log("\n╔══════════════════════════════════════════════════╗")
  console.log("║           SEED TAMAMLANDI — GİRİŞ BİLGİLERİ     ║")
  console.log("╠══════════════════════════════════════════════════╣")
  console.log("║  ADMIN                                           ║")
  console.log("║  E-posta : admin@divizyon.com                    ║")
  console.log("║  Şifre   : Admin1234!                            ║")
  console.log("╠══════════════════════════════════════════════════╣")
  console.log("║  BAŞVURU SAHİBİ                                  ║")
  console.log("║  E-posta : basvuru@divizyon.com                  ║")
  console.log("║  Şifre   : Test1234!                             ║")
  console.log("║  • DRAFT, SUBMITTED, IN_REVIEW,                  ║")
  console.log("║    EVALUATED ve SUPPORTED başvuruları var        ║")
  console.log("╠══════════════════════════════════════════════════╣")
  console.log("║  JÜRİ ÜYESİ                                      ║")
  console.log("║  E-posta : juri@divizyon.com                     ║")
  console.log("║  Şifre   : Test1234!                             ║")
  console.log("║  • 1 bekleyen + 1 tamamlanmış atama var          ║")
  console.log("╚══════════════════════════════════════════════════╝\n")
}

main()
  .catch((e) => {
    console.error("[seed] Hata:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

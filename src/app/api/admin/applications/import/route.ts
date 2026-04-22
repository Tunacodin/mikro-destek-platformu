import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import bcrypt from "bcryptjs"

// ── Şifre üretici ────────────────────────────────────────────────────────────
function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"
  let pw = ""
  for (let i = 0; i < 10; i++) {
    pw += chars[Math.floor(Math.random() * chars.length)]
  }
  return pw
}

// ── RFC 4180 CSV Parser (no external deps) ───────────────────────────────────
function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false
  let i = 0

  while (i < text.length) {
    const ch = text[i]
    const next = text[i + 1]

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"'
        i += 2
      } else if (ch === '"') {
        inQuotes = false
        i++
      } else {
        field += ch
        i++
      }
    } else {
      if (ch === '"') {
        inQuotes = true
        i++
      } else if (ch === ',') {
        row.push(field)
        field = ""
        i++
      } else if (ch === '\r' && next === '\n') {
        row.push(field)
        field = ""
        if (row.some(Boolean)) rows.push(row)
        row = []
        i += 2
      } else if (ch === '\n') {
        row.push(field)
        field = ""
        if (row.some(Boolean)) rows.push(row)
        row = []
        i++
      } else {
        field += ch
        i++
      }
    }
  }

  // Son satır
  if (field || row.length > 0) {
    row.push(field)
    if (row.some(Boolean)) rows.push(row)
  }

  return rows
}

// ── Yardımcı fonksiyonlar ─────────────────────────────────────────────────────

const SUPPORT_TYPES: { label: string; keyword: string }[] = [
  { label: "Üretim ve Altyapı Desteği",        keyword: "üretim ve altyapı" },
  { label: "Yazılım ve Teknik Araç Desteği",   keyword: "yazılım ve teknik" },
  { label: "Materyal ve Envanter Desteği",     keyword: "materyal ve envanter" },
  { label: "Mentorluk ve Uzmanlık Desteği",    keyword: "mentorluk ve uzmanlık" },
  { label: "Görünürlük ve Ağ Desteği",         keyword: "görünürlük ve ağ" },
  { label: "Akademik Üretim Desteği",           keyword: "akademik üretim" },
  { label: "Telif, Hak ve Yayıncılık Desteği", keyword: "telif" },
  { label: "Dış Temsil ve Seyahat Desteği",    keyword: "dış temsil" },
]

function norm(s: unknown): string {
  return String(s ?? "").replace(/\s+/g, " ").toLowerCase().trim()
}

function findIdx(headers: string[], ...keywords: string[]): number {
  const normed = headers.map(norm)
  for (const kw of keywords) {
    const n = norm(kw)
    const idx = normed.findIndex((h) => h.includes(n))
    if (idx !== -1) return idx
  }
  return -1
}

function cell(row: string[], idx: number): string {
  if (idx < 0 || idx >= row.length) return ""
  return row[idx].trim()
}

function parseDate(raw: string): Date | null {
  if (!raw) return null
  const d = new Date(raw)
  return isNaN(d.getTime()) ? null : d
}

// Parantez içindeki virgülleri koruyarak projectFields'ı böl (max 2)
function splitFields(raw: string): string[] {
  if (!raw) return []
  if (raw.includes("\n")) {
    return raw.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 2)
  }
  const parts: string[] = []
  let depth = 0
  let current = ""
  for (const ch of raw) {
    if (ch === "(") depth++
    else if (ch === ")") depth--
    else if (ch === "," && depth === 0) {
      if (current.trim()) parts.push(current.trim())
      current = ""
      continue
    }
    current += ch
  }
  if (current.trim()) parts.push(current.trim())
  return parts.slice(0, 2)
}

// ── Route Handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: "Form verisi okunamadı" }, { status: 400 })
  }

  const file = formData.get("file") as File | null
  const periodId = (formData.get("periodId") as string | null) || null

  if (!file) {
    return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 })
  }

  const text = await file.text()

  let allRows: string[][]
  try {
    allRows = parseCSV(text)
  } catch {
    return NextResponse.json({ error: "CSV dosyası okunamadı." }, { status: 400 })
  }

  if (allRows.length < 2) {
    return NextResponse.json({ error: "Dosyada veri satırı bulunamadı." }, { status: 400 })
  }

  const headers = allRows[0]

  const isFormCSV =
    headers.some((h) => norm(h).includes("adın soyadın")) ||
    headers.some((h) => norm(h).includes("e-posta adresin"))

  if (!isFormCSV) {
    return NextResponse.json(
      { error: "Dosya forma özel CSV formatında değil. 'Adın Soyadın' ve 'E-Posta Adresin' sütunları bulunamadı." },
      { status: 400 }
    )
  }

  const C = {
    name:                   findIdx(headers, "adın soyadın"),
    educationStatus:        findIdx(headers, "öğrenim durumun"),
    department:             findIdx(headers, "mezun olduğun"),
    address:                findIdx(headers, "adresin"),
    email:                  findIdx(headers, "e-posta adresin"),
    phone:                  findIdx(headers, "telefon numaran"),
    communityProfileUrl:    findIdx(headers, "komünite profil"),
    linkedinUrl:            findIdx(headers, "linkedin adresin"),
    twitterUrl:             findIdx(headers, "twitter"),
    teamInfo:               findIdx(headers, "ekip bilgileri"),
    title:                  findIdx(headers, "akılda kalıcı", "tanımlayan"),
    summary:                findIdx(headers, "30 saniyede"),
    targetAudience:         findIdx(headers, "doğrudan etkilenecek"),
    projectFields:          findIdx(headers, "en fazla 2 adet"),
    technologyStage:        findIdx(headers, "teknoloji/girişimcilik"),
    artStage:               findIdx(headers, "sanat/kültürel"),
    researchStage:          findIdx(headers, "araştırma/akademik"),
    problemStatement:       findIdx(headers, "hangi sorunu çözmeyi"),
    solution:               findIdx(headers, "ne tür bir çözüm"),
    innovation:             findIdx(headers, "mevcut benzerlerinden"),
    outputs:                findIdx(headers, "elde etmeyi planladığınız"),
    successCriteria:        findIdx(headers, "başarılı' sayılabilmesi", "başarılı sayılabilmesi"),
    ecosystemCollaboration: findIdx(headers, "ekosistemindeki"),
    communityContribution:  findIdx(headers, "topluluğunun geneline", "çıktıları veya süreç"),
    divisionContribution:   findIdx(headers, "kurumsal itibarına"),
    protocolAccepted:       findIdx(headers, "koşulları kabul"),
    startDate:              findIdx(headers, "Start Date"),
    submitDate:             findIdx(headers, "Submit Date"),
  }

  const supportColMap = SUPPORT_TYPES.map(({ label, keyword }) => ({
    label,
    idx: findIdx(headers, keyword),
  })).filter((s) => s.idx !== -1)

  const results = {
    created:    0,
    failed:     0,
    noTeamName: 0,
    users:      [] as { email: string; name: string | null; password: string }[],
    errors:     [] as { row: number; message: string }[],
  }

  const dataRows = allRows.slice(1)

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i]
    const rowNum = i + 2

    const email = cell(row, C.email)
    const title = cell(row, C.title)

    if (!email && !title) continue

    if (!email) {
      results.failed++
      results.errors.push({ row: rowNum, message: "E-posta boş — satır atlandı" })
      continue
    }

    try {
      const protocolAccepted = cell(row, C.protocolAccepted) === "1"
      const hasTitle = !!title
      const status: "DRAFT" | "SUBMITTED" =
        protocolAccepted && hasTitle ? "SUBMITTED" : "DRAFT"

      const submittedAt =
        status === "SUBMITTED"
          ? (parseDate(cell(row, C.submitDate)) ?? new Date())
          : null
      const createdAt = parseDate(cell(row, C.startDate)) ?? new Date()

      let user = await prisma.user.findUnique({ where: { email } })
      let plainPassword: string | null = null
      if (!user) {
        plainPassword = generatePassword()
        const passwordHash = await bcrypt.hash(plainPassword, 10)
        const name = cell(row, C.name) || null
        user = await prisma.user.create({
          data: {
            email,
            name,
            role:                "APPLICANT",
            passwordHash,
            onboardingCompleted: true,
            educationStatus:     cell(row, C.educationStatus)     || null,
            department:          cell(row, C.department)          || null,
            address:             cell(row, C.address)             || null,
            phone:               cell(row, C.phone)               || null,
            communityProfileUrl: cell(row, C.communityProfileUrl) || null,
            linkedinUrl:         cell(row, C.linkedinUrl)         || null,
            twitterUrl:          cell(row, C.twitterUrl)          || null,
          },
        })
        results.users.push({ email, name, password: plainPassword })
      }

      const projectFields = splitFields(cell(row, C.projectFields))

      const technologyStage = cell(row, C.technologyStage) || null
      const artStage        = cell(row, C.artStage)        || null
      const researchStage   = cell(row, C.researchStage)   || null

      const categories: string[] = []
      if (technologyStage) categories.push("Teknoloji/Girişimcilik")
      if (artStage)        categories.push("Sanat/Kültürel/İçerik")
      if (researchStage)   categories.push("Araştırma/Akademik")

      const supportTypes: string[] = []
      const supportNotes: Record<string, string> = {}
      for (const { label, idx } of supportColMap) {
        const reason = cell(row, idx)
        if (reason) {
          supportTypes.push(label)
          supportNotes[label] = reason
        }
      }

      const appData: Prisma.ApplicationUncheckedCreateInput = {
        title:                  title || "(İsimsiz Başvuru)",
        status,
        submittedAt,
        createdAt,
        teamName:               null,
        teamInfo:               cell(row, C.teamInfo)               || null,
        summary:                cell(row, C.summary)                || null,
        targetAudience:         cell(row, C.targetAudience)         || null,
        projectFields,
        categories,
        technologyStage,
        artStage,
        researchStage,
        problemStatement:       cell(row, C.problemStatement)       || null,
        solution:               cell(row, C.solution)               || null,
        innovation:             cell(row, C.innovation)             || null,
        outputs:                cell(row, C.outputs)                || null,
        timeline:               null,
        successCriteria:        cell(row, C.successCriteria)        || null,
        ecosystemCollaboration: cell(row, C.ecosystemCollaboration) || null,
        communityContribution:  cell(row, C.communityContribution)  || null,
        divisionContribution:   cell(row, C.divisionContribution)   || null,
        supportTypes,
        supportNotes:           Object.keys(supportNotes).length ? supportNotes : undefined,
        userId:                 user.id,
        periodId:               periodId || null,
      }

      await prisma.application.create({ data: appData })

      results.created++
      results.noTeamName++
    } catch (err) {
      results.failed++
      results.errors.push({
        row: rowNum,
        message: err instanceof Error ? err.message : "Bilinmeyen hata",
      })
    }
  }

  return NextResponse.json(results)
}

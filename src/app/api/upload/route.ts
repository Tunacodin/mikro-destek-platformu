import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { uploadFile, BUCKETS } from "@/lib/minio"
import { randomUUID } from "crypto"
import { notifyAdmins } from "@/lib/notifications"

const MAX_SIZE_MB = 50
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

// Bazı tarayıcı/işletim sistemleri PDF için "application/x-pdf", "application/octet-stream"
// veya boş mimeType döndürebiliyor. MIME katı yerine MIME + uzantı kombinasyonuyla doğruluyoruz.
const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/x-pdf",
  "application/acrobat",
  "application/vnd.pdf",
  "text/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
])

const ALLOWED_EXT = new Set([
  "pdf", "doc", "docx", "xls", "xlsx", "png", "jpg", "jpeg",
])

// Jüri sunumu için ek olarak PPTX/PPT kabul edilir
const JURY_PRESENTATION_MIME = new Set([
  "application/pdf",
  "application/x-pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-powerpoint",
])

const JURY_PRESENTATION_EXT = new Set(["pdf", "pptx", "ppt"])

function getExt(name: string): string {
  const i = name.lastIndexOf(".")
  return i >= 0 ? name.slice(i + 1).toLowerCase() : ""
}

function isAllowed(file: File): boolean {
  const ext = getExt(file.name)
  if (ALLOWED_EXT.has(ext)) return true
  const mime = (file.type || "").toLowerCase()
  return ALLOWED_MIME.has(mime)
}

function isAllowedJuryPresentation(file: File): boolean {
  const ext = getExt(file.name)
  if (JURY_PRESENTATION_EXT.has(ext)) return true
  const mime = (file.type || "").toLowerCase()
  return JURY_PRESENTATION_MIME.has(mime)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Oturum açılmamış." }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  const applicationId = formData.get("applicationId") as string | null
  const projectId = formData.get("projectId") as string | null
  const kind = (formData.get("kind") as string | null)?.toLowerCase() ?? null
  const isJuryPresentation = kind === "jury_presentation"

  if (!file) {
    return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 400 })
  }

  // Boyut kontrolü
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: `Dosya boyutu ${MAX_SIZE_MB} MB'ı aşamaz.` },
      { status: 400 }
    )
  }

  // Tip kontrolü
  if (isJuryPresentation) {
    if (!isAllowedJuryPresentation(file)) {
      return NextResponse.json(
        { error: "Sadece PPTX, PPT veya PDF formatında sunum yükleyebilirsiniz." },
        { status: 400 }
      )
    }
  } else if (!isAllowed(file)) {
    return NextResponse.json(
      { error: "Desteklenmeyen dosya türü. PDF, Word, Excel veya resim yükleyin." },
      { status: 400 }
    )
  }

  // Başvuru erişim kontrolü
  if (applicationId) {
    const application = await prisma.application.findUnique({ where: { id: applicationId } })
    if (!application) {
      return NextResponse.json({ error: "Başvuru bulunamadı." }, { status: 404 })
    }
    if (session.user.role === "APPLICANT" && application.userId !== session.user.id) {
      return NextResponse.json({ error: "Bu başvuruya erişim yetkiniz yok." }, { status: 403 })
    }

    if (isJuryPresentation) {
      // Jüri sunumu yalnızca başvuru sahibi veya admin yükleyebilir
      if (session.user.role !== "APPLICANT" && session.user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Sunum yükleme yetkiniz yok." },
          { status: 403 }
        )
      }
      // Jüri sunumu: yalnızca IN_REVIEW veya EVALUATED aşamasında
      if (!["IN_REVIEW", "EVALUATED"].includes(application.status)) {
        return NextResponse.json(
          { error: "Sunum yalnızca incelemeye alınmış başvurularda yüklenebilir." },
          { status: 400 }
        )
      }
      // Tek kopyaya izin ver — varsa eski sunumu sil
      const existing = await prisma.file.findFirst({
        where: { applicationId, type: "JURY_PRESENTATION" },
      })
      if (existing) {
        return NextResponse.json(
          { error: "Önce mevcut sunumu silin, sonra yeni sunum yükleyin." },
          { status: 400 }
        )
      }
    } else {
      // DRAFT ve SUBMITTED dışında: yalnızca admin tarafından düzenleme yetkisi verilmiş
      // veya jüri sunum tarihine 48+ saat olan başvurular dosya ekleyebilir
      const isDraftOrSubmitted = ["DRAFT", "SUBMITTED"].includes(application.status)
      const hoursToPresentation = application.presentationDate
        ? (application.presentationDate.getTime() - Date.now()) / 3_600_000
        : Infinity
      const canEditByGrant = application.editGranted && hoursToPresentation >= 48
      const canEditByPresentation = !!application.presentationDate && hoursToPresentation >= 48
      if (!isDraftOrSubmitted && !canEditByGrant && !canEditByPresentation) {
        return NextResponse.json({ error: "Bu başvuruya artık dosya yüklenemez." }, { status: 400 })
      }
    }
  }

  // Proje erişim kontrolü
  if (projectId) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { application: { select: { userId: true } } },
    })
    if (!project) {
      return NextResponse.json({ error: "Proje bulunamadı." }, { status: 404 })
    }
    if (session.user.role === "APPLICANT" && project.application.userId !== session.user.id) {
      return NextResponse.json({ error: "Bu projeye erişim yetkiniz yok." }, { status: 403 })
    }
    if (project.status !== "ACTIVE") {
      return NextResponse.json({ error: "Proje aktif değil, dosya yüklenemez." }, { status: 400 })
    }
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const ext = getExt(file.name) || "bin"
  const subfolder = isJuryPresentation ? "presentations/" : ""
  const folder = projectId
    ? `projects/${projectId}`
    : (applicationId ? `${applicationId}/${subfolder}`.replace(/\/$/, "") : "general")
  const key = `${folder}/${randomUUID()}.${ext}`
  const bucket = projectId ? BUCKETS.projects : BUCKETS.applications

  // file.type bazı tarayıcılarda boş gelebiliyor — uzantıdan tahmin et
  const EXT_MIME: Record<string, string> = {
    pdf:  "application/pdf",
    doc:  "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls:  "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    png:  "image/png",
    jpg:  "image/jpeg",
    jpeg: "image/jpeg",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ppt:  "application/vnd.ms-powerpoint",
  }
  const resolvedMime = file.type || EXT_MIME[ext] || "application/octet-stream"

  try {
    await uploadFile({ bucket, key, buffer, mimeType: resolvedMime, size: file.size })
  } catch (err) {
    console.error("MinIO upload failed:", err)
    return NextResponse.json(
      { error: "Dosya depolama servisine yüklenemedi. Lütfen tekrar deneyin." },
      { status: 502 }
    )
  }

  // DB'ye kaydet
  const dbFile = await prisma.file.create({
    data: {
      name: file.name,
      url: `/${bucket}/${key}`,
      size: file.size,
      mimeType: resolvedMime,
      bucket,
      key,
      type: isJuryPresentation ? "JURY_PRESENTATION" : "FILE",
      ...(applicationId ? { applicationId } : {}),
      ...(projectId ? { projectId } : {}),
    },
  })

  if (session.user.role === "APPLICANT") {
    if (applicationId) {
      const app = await prisma.application.findUnique({
        where: { id: applicationId },
        select: { title: true },
      })
      if (app) {
        await notifyAdmins({
          title: isJuryPresentation ? "Jüri sunumu yüklendi" : "Başvuruya dosya eklendi",
          message: isJuryPresentation
            ? `"${app.title}" başvurusu için jüri sunumu yüklendi.`
            : `"${app.title}" başvurusuna yeni bir dosya yüklendi: ${file.name}`,
          link: `/admin/applications/${applicationId}`,
        })
      }
    } else if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { application: { select: { id: true, title: true } } },
      })
      if (project) {
        await notifyAdmins({
          title: "Projeye dosya eklendi",
          message: `"${project.application.title}" projesine yeni bir dosya yüklendi: ${file.name}`,
          link: `/admin/applications/${project.application.id}`,
        })
      }
    }
  }

  return NextResponse.json({
    id: dbFile.id,
    name: dbFile.name,
    size: dbFile.size,
    mimeType: dbFile.mimeType,
    url: dbFile.url,
  })
}

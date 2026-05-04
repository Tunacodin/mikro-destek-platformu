import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { uploadFile, BUCKETS } from "@/lib/minio"
import { randomUUID } from "crypto"
import { notifyAdmins } from "@/lib/notifications"

const MAX_SIZE_MB = 25
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

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Oturum açılmamış." }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  const applicationId = formData.get("applicationId") as string | null
  const projectId = formData.get("projectId") as string | null

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

  // Tip kontrolü (MIME ya da uzantı eşleşmesi yeterli)
  if (!isAllowed(file)) {
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
    if (!["DRAFT", "SUBMITTED"].includes(application.status)) {
      return NextResponse.json({ error: "Bu başvuruya artık dosya yüklenemez." }, { status: 400 })
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
  const folder = projectId ? `projects/${projectId}` : (applicationId ?? "general")
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
          title: "Başvuruya dosya eklendi",
          message: `"${app.title}" başvurusuna yeni bir dosya yüklendi: ${file.name}`,
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

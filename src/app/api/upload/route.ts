import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { uploadFile, BUCKETS } from "@/lib/minio"
import { randomUUID } from "crypto"
import { notifyAdmins } from "@/lib/notifications"

const MAX_SIZE_MB = 10
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

const ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
]

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

  // Tip kontrolü
  if (!ALLOWED_TYPES.includes(file.type)) {
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

  const ext = file.name.split(".").pop() ?? "bin"
  const folder = projectId ? `projects/${projectId}` : (applicationId ?? "general")
  const key = `${folder}/${randomUUID()}.${ext}`
  const bucket = projectId ? BUCKETS.projects : BUCKETS.applications

  await uploadFile({ bucket, key, buffer, mimeType: file.type, size: file.size })

  // DB'ye kaydet
  const dbFile = await prisma.file.create({
    data: {
      name: file.name,
      url: `/${bucket}/${key}`,
      size: file.size,
      mimeType: file.type,
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

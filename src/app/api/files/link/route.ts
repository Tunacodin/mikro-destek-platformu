import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Oturum acilmamis." }, { status: 401 })
  }

  const body = await req.json()
  const { url, name, applicationId, projectId } = body as {
    url?: string
    name?: string
    applicationId?: string
    projectId?: string
  }

  if (!url || !name) {
    return NextResponse.json(
      { error: "URL ve baslik zorunludur." },
      { status: 400 }
    )
  }

  // Basic URL validation
  try {
    new URL(url)
  } catch {
    return NextResponse.json(
      { error: "Gecerli bir URL giriniz." },
      { status: 400 }
    )
  }

  // Application access check
  if (applicationId) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
    })
    if (!application) {
      return NextResponse.json({ error: "Basvuru bulunamadi." }, { status: 404 })
    }
    if (
      session.user.role === "APPLICANT" &&
      application.userId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "Bu basvuruya erisim yetkiniz yok." },
        { status: 403 }
      )
    }
    if (!["DRAFT", "SUBMITTED"].includes(application.status)) {
      return NextResponse.json(
        { error: "Bu basvuruya artik dosya/link eklenemez." },
        { status: 400 }
      )
    }
  }

  // Project access check
  if (projectId) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { application: { select: { userId: true } } },
    })
    if (!project) {
      return NextResponse.json({ error: "Proje bulunamadi." }, { status: 404 })
    }
    if (
      session.user.role === "APPLICANT" &&
      project.application.userId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "Bu projeye erisim yetkiniz yok." },
        { status: 403 }
      )
    }
    if (project.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Proje aktif degil, link eklenemez." },
        { status: 400 }
      )
    }
  }

  const dbFile = await prisma.file.create({
    data: {
      name,
      url,
      size: 0,
      mimeType: "text/uri-list",
      bucket: "",
      key: "",
      type: "LINK",
      ...(applicationId ? { applicationId } : {}),
      ...(projectId ? { projectId } : {}),
    },
  })

  return NextResponse.json({
    id: dbFile.id,
    name: dbFile.name,
    url: dbFile.url,
    size: dbFile.size,
    mimeType: dbFile.mimeType,
    type: dbFile.type,
  })
}

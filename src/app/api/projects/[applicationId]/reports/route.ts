import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const reportSchema = z.object({
  content: z.string().min(50, "Rapor içeriği en az 50 karakter olmalıdır."),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 })
  }

  const { applicationId } = await params

  const project = await prisma.project.findUnique({
    where: { applicationId },
    include: {
      application: { select: { userId: true } },
      reports: { orderBy: { createdAt: "desc" } },
    },
  })

  if (!project) {
    return NextResponse.json({ error: "Proje bulunamadı." }, { status: 404 })
  }

  if (
    session.user.role === "APPLICANT" &&
    project.application.userId !== session.user.id
  ) {
    return NextResponse.json({ error: "Erişim reddedildi." }, { status: 403 })
  }

  return NextResponse.json(project.reports)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "APPLICANT") {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 })
  }

  const { applicationId } = await params
  const body = await req.json()
  const parsed = reportSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const project = await prisma.project.findUnique({
    where: { applicationId },
    include: { application: { select: { userId: true } } },
  })

  if (!project) {
    return NextResponse.json({ error: "Proje bulunamadı." }, { status: 404 })
  }

  if (project.application.userId !== session.user.id) {
    return NextResponse.json({ error: "Erişim reddedildi." }, { status: 403 })
  }

  if (project.status !== "ACTIVE") {
    return NextResponse.json({ error: "Proje aktif değil." }, { status: 400 })
  }

  const report = await prisma.projectReport.create({
    data: {
      projectId: project.id,
      content: parsed.data.content,
    },
  })

  return NextResponse.json(report, { status: 201 })
}

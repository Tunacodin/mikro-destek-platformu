import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

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
      application: {
        include: {
          user: { select: { id: true, name: true, email: true } },
          period: { select: { title: true } },
        },
      },
      decision: {
        select: { scope: true, notes: true, decidedAt: true },
      },
      reports: { orderBy: { createdAt: "desc" } },
    },
  })

  if (!project) {
    return NextResponse.json({ error: "Proje bulunamadı." }, { status: 404 })
  }

  // Başvuru sahibi sadece kendi projesini görebilir
  if (
    session.user.role === "APPLICANT" &&
    project.application.user.id !== session.user.id
  ) {
    return NextResponse.json({ error: "Erişim reddedildi." }, { status: 403 })
  }

  return NextResponse.json(project)
}

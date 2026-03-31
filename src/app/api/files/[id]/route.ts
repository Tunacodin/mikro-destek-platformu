import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getPresignedUrl } from "@/lib/minio"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Oturum açılmamış." }, { status: 401 })
  }

  const { id } = await params
  const file = await prisma.file.findUnique({
    where: { id },
    include: {
      application: { select: { userId: true, juryAssignments: { select: { juryId: true } } } },
    },
  })

  if (!file) {
    return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 404 })
  }

  // Erişim kontrolü
  if (session.user.role === "APPLICANT" && file.application?.userId !== session.user.id) {
    return NextResponse.json({ error: "Erişim reddedildi." }, { status: 403 })
  }

  if (session.user.role === "JURY") {
    const assigned = file.application?.juryAssignments.some(
      (a) => a.juryId === session.user.id
    )
    if (!assigned) {
      return NextResponse.json({ error: "Erişim reddedildi." }, { status: 403 })
    }
  }

  const url = await getPresignedUrl(file.bucket, file.key)
  return NextResponse.redirect(url)
}

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 })
  }

  const { id } = await params

  const application = await prisma.application.findUnique({
    where: { id },
    select: { id: true, title: true, userId: true },
  })
  if (!application) {
    return NextResponse.json({ error: "Bulunamadı." }, { status: 404 })
  }

  await prisma.$transaction(async (tx) => {
    // İlişkili kayıtları sil
    await tx.evaluationScore.deleteMany({ where: { evaluation: { applicationId: id } } })
    await tx.evaluation.deleteMany({ where: { applicationId: id } })
    await tx.juryAssignment.deleteMany({ where: { applicationId: id } })
    await tx.fileNote.deleteMany({ where: { file: { applicationId: id } } })
    await tx.file.deleteMany({ where: { applicationId: id } })
    await tx.project.deleteMany({ where: { applicationId: id } })
    await tx.supportDecision.deleteMany({ where: { applicationId: id } })
    await tx.application.delete({ where: { id } })

    await tx.auditLog.create({
      data: {
        action: "APPLICATION_DELETED",
        metadata: { applicationId: id, title: application.title },
        userId: session.user.id,
      },
    })
  })

  return NextResponse.json({ ok: true })
}

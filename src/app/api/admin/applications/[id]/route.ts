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

  const adminUser = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { id: true },
  })
  if (!adminUser) {
    return NextResponse.json({ error: "Admin kullanıcı bulunamadı." }, { status: 403 })
  }

  const application = await prisma.application.findUnique({
    where: { id },
    select: { id: true, title: true, userId: true },
  })
  if (!application) {
    return NextResponse.json({ error: "Bulunamadı." }, { status: 404 })
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Proje ve çocukları (SupportDecision'dan önce silinmeli çünkü Project.decisionId FK var)
      const project = await tx.project.findUnique({
        where: { applicationId: id },
        select: { id: true },
      })
      if (project) {
        await tx.projectReport.deleteMany({ where: { projectId: project.id } })
        const projectFileIds = await tx.file
          .findMany({ where: { projectId: project.id }, select: { id: true } })
          .then((r) => r.map((f) => f.id))
        if (projectFileIds.length) {
          await tx.fileNote.deleteMany({ where: { fileId: { in: projectFileIds } } })
          await tx.file.deleteMany({ where: { id: { in: projectFileIds } } })
        }
        await tx.project.delete({ where: { id: project.id } })
      }

      // 2. Destek kararı
      await tx.supportDecision.deleteMany({ where: { applicationId: id } })

      // 3. Değerlendirmeler
      const evalIds = await tx.evaluation
        .findMany({ where: { applicationId: id }, select: { id: true } })
        .then((r) => r.map((e) => e.id))
      if (evalIds.length) {
        await tx.evaluationScore.deleteMany({ where: { evaluationId: { in: evalIds } } })
        await tx.evaluation.deleteMany({ where: { id: { in: evalIds } } })
      }

      // 4. Jüri atamaları
      await tx.juryAssignment.deleteMany({ where: { applicationId: id } })

      // 5. Başvuru dosyaları
      const appFileIds = await tx.file
        .findMany({ where: { applicationId: id }, select: { id: true } })
        .then((r) => r.map((f) => f.id))
      if (appFileIds.length) {
        await tx.fileNote.deleteMany({ where: { fileId: { in: appFileIds } } })
        await tx.file.deleteMany({ where: { id: { in: appFileIds } } })
      }

      // 6. Başvuruyu sil
      await tx.application.delete({ where: { id } })

      await tx.auditLog.create({
        data: {
          action: "APPLICATION_DELETED",
          metadata: { applicationId: id, title: application.title },
          userId: adminUser.id,
        },
      })
    })
  } catch (err) {
    console.error("Application delete error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Silme işlemi başarısız." },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}

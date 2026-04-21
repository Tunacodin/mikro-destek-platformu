import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import type { ApplicationStatus } from "@prisma/client"
import { createNotification, STATUS_NOTIFICATION } from "@/lib/notifications"

const schema = z.object({
  status: z.enum(["DRAFT", "IN_REVIEW", "EVALUATED", "SUPPORTED", "REJECTED"]),
  scope: z.enum(["LIMITED", "EXTENDED", "PRIORITY"]).optional(),
  notes: z.string().optional(),
  // Aşama 3: Admin jüri sunum tarihini set eder
  presentationDate: z.string().datetime().optional(),
  // Aşama 5b: Admin destek süresi bitişini set eder
  supportEndDate: z.string().datetime().optional(),
})

const VALID_TRANSITIONS: Partial<Record<ApplicationStatus, ApplicationStatus[]>> = {
  SUBMITTED: ["IN_REVIEW", "DRAFT", "REJECTED"], // DRAFT = revize, REJECTED = doğrudan red
  IN_REVIEW: ["EVALUATED"],
  EVALUATED: ["SUPPORTED", "REJECTED"],
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { status: newStatus, scope, notes, presentationDate, supportEndDate } = parsed.data

  if (newStatus === "SUPPORTED" && !scope) {
    return NextResponse.json({ error: "Destek kapsamı (scope) zorunludur." }, { status: 400 })
  }

  const application = await prisma.application.findUnique({
    where: { id },
    select: { id: true, status: true, userId: true, title: true },
  })
  if (!application) {
    return NextResponse.json({ error: "Bulunamadı." }, { status: 404 })
  }

  const allowed = VALID_TRANSITIONS[application.status] ?? []
  if (!allowed.includes(newStatus)) {
    return NextResponse.json(
      { error: `${application.status} → ${newStatus} geçişi geçersiz.` },
      { status: 400 }
    )
  }

  const updated = await prisma.$transaction(async (tx) => {
    // Uygulama durumunu ve yeni alanları güncelle
    const updateData: Record<string, unknown> = { status: newStatus }
    if (newStatus === "IN_REVIEW" && presentationDate) {
      updateData.presentationDate = new Date(presentationDate)
    }
    if (notes && (newStatus === "DRAFT" || newStatus === "REJECTED")) {
      updateData.reviewNotes = notes
    }

    const app = await tx.application.update({ where: { id }, data: updateData })

    // SUPPORTED → SupportDecision + Project oluştur
    if (newStatus === "SUPPORTED" && scope) {
      const decision = await tx.supportDecision.create({
        data: {
          applicationId: id,
          scope,
          notes: notes ?? null,
          decidedById: session.user.id,
        },
      })
      await tx.project.create({
        data: {
          applicationId: id,
          decisionId: decision.id,
          status: "ACTIVE",
          supportEndDate: supportEndDate ? new Date(supportEndDate) : null,
        },
      })
    }

    await tx.auditLog.create({
      data: {
        action: `STATUS_CHANGED_TO_${newStatus}`,
        metadata: { applicationId: id, title: application.title, scope, notes, presentationDate, supportEndDate },
        userId: session.user.id,
      },
    })

    return app
  })

  // Başvuru sahibine bildirim
  const notif = STATUS_NOTIFICATION[newStatus]
  if (notif) {
    const applicantLink = newStatus === "SUPPORTED"
      ? `/dashboard/projects/${id}`
      : `/dashboard/applications/${id}`
    await createNotification({ userId: application.userId, title: notif.title, message: notif.message, link: applicantLink })
  }

  // EVALUATED → admin bildirimi
  if (newStatus === "EVALUATED") {
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } })
    await Promise.all(
      admins.map((admin) =>
        createNotification({
          userId: admin.id,
          title: "Başvuru değerlendirmesi tamamlandı",
          message: `"${application.title}" başvurusu jüri tarafından değerlendirildi. Destek kararı verebilirsiniz.`,
          link: `/admin/applications/${id}`,
        })
      )
    )
  }

  return NextResponse.json(updated)
}

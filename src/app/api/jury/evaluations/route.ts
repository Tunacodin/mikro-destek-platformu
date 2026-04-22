import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { createNotification, notifyAdmins } from "@/lib/notifications"

const scoreSchema = z.object({
  criteria: z.string().min(1),
  score: z.number().int().min(1).max(5),
  justification: z.string().min(10, "Gerekçe en az 10 karakter olmalı."),
})

const evaluationSchema = z.object({
  applicationId: z.string().min(1),
  comment: z.string().optional(),
  scores: z.array(scoreSchema).min(1, "En az bir kriter puanlanmalı."),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "JURY") {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 })
  }

  const body = await req.json()
  const parsed = evaluationSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { applicationId, comment, scores } = parsed.data
  const juryId = session.user.id

  // Jüri bu başvuruya atanmış olmalı
  const assignment = await prisma.juryAssignment.findUnique({
    where: { juryId_applicationId: { juryId, applicationId } },
  })
  if (!assignment) {
    return NextResponse.json({ error: "Bu başvuruya atanmış değilsiniz." }, { status: 403 })
  }

  // Başvuru IN_REVIEW durumunda olmalı
  const application = await prisma.application.findUnique({ where: { id: applicationId } })
  if (!application || application.status !== "IN_REVIEW") {
    return NextResponse.json(
      { error: "Yalnızca 'İncelemede' durumundaki başvurular değerlendirilebilir." },
      { status: 400 }
    )
  }

  // Bu jürinin bu başvuru için mevcut değerlendirmesini kontrol et
  const existing = await prisma.evaluation.findUnique({
    where: { juryId_applicationId: { juryId, applicationId } },
  })

  const evaluation = await prisma.$transaction(async (tx) => {
    if (existing) {
      // Önceki puanları sil, yenilerini ekle
      await tx.evaluationScore.deleteMany({ where: { evaluationId: existing.id } })
      return tx.evaluation.update({
        where: { id: existing.id },
        data: {
          comment,
          scores: { create: scores },
        },
        include: { scores: true },
      })
    }

    const newEval = await tx.evaluation.create({
      data: {
        juryId,
        applicationId,
        comment,
        scores: { create: scores },
      },
      include: { scores: true },
    })

    // Tüm jüriler değerlendirdi mi kontrol et
    const [assignmentCount, evaluationCount] = await Promise.all([
      tx.juryAssignment.count({ where: { applicationId } }),
      tx.evaluation.count({ where: { applicationId } }),
    ])

    if (evaluationCount >= assignmentCount) {
      await tx.application.update({
        where: { id: applicationId },
        data: { status: "EVALUATED" },
      })
    }

    return newEval
  })

  // Her yeni değerlendirmede admin'e bildir
  const juryName = await prisma.user.findUnique({
    where: { id: juryId },
    select: { name: true, email: true },
  }).then((u) => u?.name ?? u?.email ?? "Jüri üyesi")

  const [assignmentCount, evaluationCount] = await Promise.all([
    prisma.juryAssignment.count({ where: { applicationId } }),
    prisma.evaluation.count({ where: { applicationId } }),
  ])

  if (evaluationCount >= assignmentCount) {
    // Tüm jüri tamamladı
    await notifyAdmins({
      title: "Tüm jüri değerlendirmeleri tamamlandı",
      message: `"${application.title}" başvurusu tüm jüri üyeleri tarafından değerlendirildi. Destek kararı verebilirsiniz.`,
      link: `/admin/applications/${applicationId}`,
    })
  } else {
    // Kısmi değerlendirme
    await notifyAdmins({
      title: "Jüri değerlendirmesi yapıldı",
      message: `${juryName}, "${application.title}" başvurusunu değerlendirdi. (${evaluationCount}/${assignmentCount} tamamlandı)`,
      link: `/admin/applications/${applicationId}`,
    })
  }

  return NextResponse.json(evaluation, { status: existing ? 200 : 201 })
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "JURY") {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const applicationId = searchParams.get("applicationId")

  if (!applicationId) {
    return NextResponse.json({ error: "applicationId gerekli." }, { status: 400 })
  }

  const juryId = session.user.id

  // Jüri atamasını kontrol et
  const assignment = await prisma.juryAssignment.findUnique({
    where: { juryId_applicationId: { juryId, applicationId } },
  })
  if (!assignment) {
    return NextResponse.json({ error: "Bu başvuruya erişim yetkiniz yok." }, { status: 403 })
  }

  const evaluation = await prisma.evaluation.findUnique({
    where: { juryId_applicationId: { juryId, applicationId } },
    include: { scores: true },
  })

  return NextResponse.json(evaluation)
}

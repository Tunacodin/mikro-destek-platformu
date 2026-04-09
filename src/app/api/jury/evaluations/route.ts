import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { createNotification } from "@/lib/notifications"

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

  // Zaten değerlendirme yapılmışsa güncelle, yoksa oluştur
  const existing = await prisma.evaluation.findUnique({ where: { applicationId } })

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

    // Başvuruyu EVALUATED durumuna geçir
    await tx.application.update({
      where: { id: applicationId },
      data: { status: "EVALUATED" },
    })

    return newEval
  })

  // Yeni değerlendirmede (ilk kez) tüm adminlere bildirim gönder
  if (!existing) {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    })
    await Promise.all(
      admins.map((admin) =>
        createNotification({
          userId: admin.id,
          title: "Başvuru değerlendirildi",
          message: `Bir başvuru jüri tarafından değerlendirildi ve "Değerlendirildi" durumuna geçti. Destek kararı verebilirsiniz.`,
        })
      )
    )
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
    where: { applicationId },
    include: { scores: true },
  })

  return NextResponse.json(evaluation)
}

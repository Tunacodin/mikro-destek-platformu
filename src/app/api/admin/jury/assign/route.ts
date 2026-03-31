import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  applicationId: z.string().min(1),
  juryId: z.string().min(1),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { applicationId, juryId } = parsed.data

  // Başvuru IN_REVIEW durumunda olmalı
  const application = await prisma.application.findUnique({ where: { id: applicationId } })
  if (!application) {
    return NextResponse.json({ error: "Başvuru bulunamadı." }, { status: 404 })
  }
  if (application.status !== "IN_REVIEW") {
    return NextResponse.json(
      { error: "Yalnızca 'İncelemede' durumundaki başvurulara jüri atanabilir." },
      { status: 400 }
    )
  }

  // Jüri üyesi JURY rolünde olmalı
  const jury = await prisma.user.findUnique({ where: { id: juryId } })
  if (!jury || jury.role !== "JURY") {
    return NextResponse.json({ error: "Geçersiz jüri üyesi." }, { status: 400 })
  }

  // Zaten atanmışsa çakışma döndür
  const existing = await prisma.juryAssignment.findUnique({
    where: { juryId_applicationId: { juryId, applicationId } },
  })
  if (existing) {
    return NextResponse.json({ error: "Bu jüri üyesi zaten atanmış." }, { status: 409 })
  }

  const assignment = await prisma.juryAssignment.create({
    data: { juryId, applicationId },
    include: { jury: { select: { name: true, email: true } } },
  })

  return NextResponse.json(assignment, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { applicationId, juryId } = parsed.data

  await prisma.juryAssignment.delete({
    where: { juryId_applicationId: { juryId, applicationId } },
  })

  return NextResponse.json({ message: "Atama kaldırıldı." })
}

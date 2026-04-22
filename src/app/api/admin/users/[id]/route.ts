import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import bcrypt from "bcryptjs"

const patchSchema = z.object({
  role:     z.enum(["ADMIN", "APPLICANT", "JURY"]).optional(),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı").optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 })
  }

  const adminUser = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { id: true },
  })
  if (!adminUser) {
    return NextResponse.json({ error: "Admin kullanıcı bulunamadı." }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 })

  const updateData: Record<string, unknown> = {}
  if (parsed.data.role !== undefined) updateData.role = parsed.data.role
  if (parsed.data.password !== undefined) {
    updateData.passwordHash = await bcrypt.hash(parsed.data.password, 12)
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })

  await prisma.auditLog.create({
    data: {
      action: "USER_UPDATED",
      metadata: { targetUserId: id, ...parsed.data },
      userId: adminUser.id,
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 })
  }

  const adminUser = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { id: true },
  })
  if (!adminUser) {
    return NextResponse.json({ error: "Admin kullanıcı bulunamadı." }, { status: 403 })
  }

  const { id } = await params

  if (id === adminUser.id) {
    return NextResponse.json({ error: "Kendi hesabınızı silemezsiniz." }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id },
    include: { _count: { select: { applications: true } } },
  })
  if (!user) return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 })

  // Başvurusu olan kullanıcı silinemez — kayıtlar korunmalı
  if (user._count.applications > 0) {
    return NextResponse.json(
      { error: `Bu kullanıcının ${user._count.applications} başvurusu var. Başvuruları olan kullanıcılar silinemez.` },
      { status: 409 }
    )
  }

  // Cascade silme: foreign key kısıtlamaları nedeniyle sırayla siliyoruz
  await prisma.$transaction(async (tx) => {
    // Kullanıcının yaptığı değerlendirmeler (jüri olarak)
    const evalsByJury = await tx.evaluation.findMany({ where: { juryId: id }, select: { id: true } })
    const evalIds = evalsByJury.map((e) => e.id)

    // Değerlendirme puanları
    await tx.evaluationScore.deleteMany({ where: { evaluationId: { in: evalIds } } })

    // Değerlendirmeler
    await tx.evaluation.deleteMany({ where: { juryId: id } })

    // Jüri atamaları
    await tx.juryAssignment.deleteMany({ where: { juryId: id } })

    // Kullanıcının yazdığı dosya notları
    await tx.fileNote.deleteMany({ where: { userId: id } })

    // Bildirimler ve audit log
    await tx.notification.deleteMany({ where: { userId: id } })
    await tx.auditLog.deleteMany({ where: { userId: id } })

    // Kullanıcıyı sil
    await tx.user.delete({ where: { id } })
  })

  await prisma.auditLog.create({
    data: {
      action: "USER_DELETED",
      metadata: { deletedUserId: id, email: user.email, role: user.role },
      userId: adminUser.id,
    },
  })

  return NextResponse.json({ ok: true })
}

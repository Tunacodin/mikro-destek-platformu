import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  presentationDate: z.string().datetime().nullable(),
})

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

  const { presentationDate } = parsed.data

  const adminUser = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { id: true },
  })
  if (!adminUser) {
    return NextResponse.json({ error: "Admin kullanıcı bulunamadı." }, { status: 403 })
  }

  const application = await prisma.application.findUnique({
    where: { id },
    select: { id: true, status: true, title: true },
  })
  if (!application) {
    return NextResponse.json({ error: "Bulunamadı." }, { status: 404 })
  }

  // Sadece aktif değerlendirme sürecinde olan başvurularda düzenlenebilir
  if (!["SUBMITTED", "IN_REVIEW"].includes(application.status)) {
    return NextResponse.json(
      { error: "Bu başvurunun sunum tarihi artık düzenlenemez." },
      { status: 400 }
    )
  }

  const updated = await prisma.application.update({
    where: { id },
    data: { presentationDate: presentationDate ? new Date(presentationDate) : null },
  })

  await prisma.auditLog.create({
    data: {
      action: "PRESENTATION_DATE_UPDATED",
      metadata: { applicationId: id, title: application.title, presentationDate },
      userId: adminUser.id,
    },
  })

  return NextResponse.json(updated)
}

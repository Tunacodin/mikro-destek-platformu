import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateSchema = z.object({
  title: z.string().min(3, "Başlık en az 3 karakter olmalıdır").optional(),
  description: z.string().min(50, "Açıklama en az 50 karakter olmalıdır").optional(),
})

// DRAFT başvuru güncelle
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "APPLICANT") {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 })
  }

  const { id } = await params

  const application = await prisma.application.findUnique({
    where: { id },
    include: { period: { select: { endDate: true, status: true } } },
  })

  if (!application) return NextResponse.json({ error: "Bulunamadı." }, { status: 404 })
  if (application.userId !== session.user.id) {
    return NextResponse.json({ error: "Erişim reddedildi." }, { status: 403 })
  }
  if (application.status !== "DRAFT") {
    return NextResponse.json({ error: "Yalnızca taslak başvurular düzenlenebilir." }, { status: 400 })
  }

  // 48 saat kuralı: dönem bitimine 48 saatten az kaldıysa düzenleme kapalı
  const hoursLeft = (application.period.endDate.getTime() - Date.now()) / 3_600_000
  if (hoursLeft < 48) {
    return NextResponse.json(
      { error: "Dönem bitimine 48 saatten az kaldığı için düzenleme yetkisi kapalıdır." },
      { status: 400 }
    )
  }

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const updated = await prisma.application.update({
    where: { id },
    data: parsed.data,
  })

  return NextResponse.json(updated)
}

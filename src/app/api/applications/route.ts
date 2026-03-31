import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createSchema = z.object({
  periodId: z.string().min(1, "Dönem seçiniz"),
  title: z.string().min(3, "Başlık en az 3 karakter olmalıdır"),
  description: z.string().min(50, "Açıklama en az 50 karakter olmalıdır"),
})

// Başvuru oluştur (DRAFT)
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "APPLICANT") {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 })
  }

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  // Dönem aktif mi?
  const period = await prisma.applicationPeriod.findUnique({
    where: { id: parsed.data.periodId },
  })
  if (!period || period.status !== "ACTIVE") {
    return NextResponse.json({ error: "Dönem aktif değil." }, { status: 400 })
  }

  // 48 saat kuralı: bitiş tarihine 48 saatten az kaldıysa başvuru yapılamaz
  const hoursLeft = (period.endDate.getTime() - Date.now()) / 3_600_000
  if (hoursLeft < 48) {
    return NextResponse.json(
      { error: "Dönem bitimine 48 saatten az kaldığı için yeni başvuru alınamaz." },
      { status: 400 }
    )
  }

  const application = await prisma.application.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      status: "DRAFT",
      userId: session.user.id,
      periodId: parsed.data.periodId,
    },
  })

  return NextResponse.json(application, { status: 201 })
}

// Başvurularımı listele
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 })

  const where =
    session.user.role === "APPLICANT"
      ? { userId: session.user.id }
      : session.user.role === "ADMIN"
      ? {}
      : { juryAssignments: { some: { juryId: session.user.id } } }

  const applications = await prisma.application.findMany({
    where,
    include: {
      period: { select: { title: true, endDate: true } },
      _count: { select: { files: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(applications)
}

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createSchema = z.object({
  title:     z.string().min(3, "Dönem adı en az 3 karakter olmalıdır"),
  startDate: z.string().datetime(),
  endDate:   z.string().datetime(),
}).refine((d) => new Date(d.endDate) > new Date(d.startDate), {
  message: "Bitiş tarihi başlangıçtan sonra olmalıdır",
  path: ["endDate"],
})

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 })
  }

  const periods = await prisma.applicationPeriod.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { applications: true } } },
  })

  return NextResponse.json(periods)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 })
  }

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const period = await prisma.applicationPeriod.create({
    data: {
      title:     parsed.data.title,
      startDate: new Date(parsed.data.startDate),
      endDate:   new Date(parsed.data.endDate),
      status:    "DRAFT",
    },
  })

  return NextResponse.json(period, { status: 201 })
}

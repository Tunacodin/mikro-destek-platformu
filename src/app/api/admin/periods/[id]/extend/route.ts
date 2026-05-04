import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  endDate: z.string().datetime(),
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

  const period = await prisma.applicationPeriod.findUnique({ where: { id } })
  if (!period) {
    return NextResponse.json({ error: "Dönem bulunamadı." }, { status: 404 })
  }
  if (period.status === "CLOSED") {
    return NextResponse.json({ error: "Kapalı dönem uzatılamaz." }, { status: 400 })
  }

  const newEnd = new Date(parsed.data.endDate)
  if (newEnd <= period.startDate) {
    return NextResponse.json(
      { error: "Bitiş tarihi başlangıçtan sonra olmalıdır." },
      { status: 400 }
    )
  }
  if (newEnd <= new Date()) {
    return NextResponse.json(
      { error: "Bitiş tarihi geçmişte olamaz." },
      { status: 400 }
    )
  }

  const updated = await prisma.applicationPeriod.update({
    where: { id },
    data: { endDate: newEnd },
  })

  return NextResponse.json(updated)
}

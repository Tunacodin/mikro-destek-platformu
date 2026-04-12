import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateSchema = z.object({
  title:          z.string().min(3).optional(),
  teamName:       z.string().optional(),
  teamInfo:       z.string().optional(),
  summary:        z.string().max(1500).optional(),
  targetAudience: z.string().optional(),
  categories:     z.array(z.string()).max(2).optional(),
  technologyStage:z.string().optional(),
  artStage:       z.string().optional(),
  researchStage:  z.string().optional(),
  problemStatement:       z.string().optional(),
  solution:               z.string().optional(),
  innovation:             z.string().optional(),
  outputs:                z.string().optional(),
  timeline:               z.string().optional(),
  successCriteria:        z.string().optional(),
  ecosystemCollaboration: z.string().optional(),
  communityContribution:  z.string().optional(),
  divisionContribution:   z.string().optional(),
  supportTypes:           z.array(z.string()).optional(),
  supportNotes:           z.record(z.string(), z.string()).optional(),
})

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
    include: {
      period:  { select: { endDate: true, status: true } },
      program: { select: { endDate: true, status: true } },
    },
  })

  if (!application) return NextResponse.json({ error: "Bulunamadı." }, { status: 404 })
  if (application.userId !== session.user.id) {
    return NextResponse.json({ error: "Erişim reddedildi." }, { status: 403 })
  }
  if (application.status !== "DRAFT") {
    return NextResponse.json({ error: "Yalnızca taslak başvurular düzenlenebilir." }, { status: 400 })
  }

  // 48 saat kuralı yalnızca dönem için geçerli
  if (application.period) {
    const hoursLeft = (application.period.endDate.getTime() - Date.now()) / 3_600_000
    if (hoursLeft < 48) {
      return NextResponse.json(
        { error: "Dönem bitimine 48 saatten az kaldığı için düzenleme yetkisi kapalıdır." },
        { status: 400 }
      )
    }
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

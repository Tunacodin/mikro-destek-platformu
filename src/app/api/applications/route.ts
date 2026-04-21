import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createSchema = z.object({
  periodId:  z.string().optional(),
  programId: z.string().optional(),
  title:         z.string().min(1, "Proje adı zorunludur"),
  teamName:      z.string().optional().default(""),
  teamInfo:      z.string().optional().default(""),
  summary:       z.string().max(1500).optional().default(""),
  targetAudience:z.string().optional().default(""),
  projectFields: z.array(z.string()).max(2).optional().default([]),
  categories:    z.array(z.string()).max(2).optional().default([]),
  technologyStage: z.string().optional().default(""),
  artStage:        z.string().optional().default(""),
  researchStage:   z.string().optional().default(""),
  problemStatement:       z.string().optional().default(""),
  solution:               z.string().optional().default(""),
  innovation:             z.string().optional().default(""),
  outputs:                z.string().optional().default(""),
  timeline:               z.string().optional().default(""),
  successCriteria:        z.string().optional().default(""),
  ecosystemCollaboration: z.string().optional().default(""),
  communityContribution:  z.string().optional().default(""),
  divisionContribution:   z.string().optional().default(""),
  supportTypes:           z.array(z.string()).optional().default([]),
  supportNotes:           z.record(z.string(), z.string()).optional(),
}).refine(
  (d) => Boolean(d.periodId) !== Boolean(d.programId),
  { message: "Dönem veya program seçiniz (ikisi birden seçilemez)" }
)

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

  const { periodId, programId, ...rest } = parsed.data

  // Dönem veya Program aktif mi? + 48 saat kuralı (yalnızca dönem için)
  if (periodId) {
    const period = await prisma.applicationPeriod.findUnique({ where: { id: periodId } })
    if (!period || period.status !== "ACTIVE") {
      return NextResponse.json({ error: "Dönem aktif değil." }, { status: 400 })
    }
    const hoursLeft = (period.endDate.getTime() - Date.now()) / 3_600_000
    if (hoursLeft < 48) {
      return NextResponse.json(
        { error: "Dönem bitimine 48 saatten az kaldığı için yeni başvuru alınamaz." },
        { status: 400 }
      )
    }
  }

  if (programId) {
    const program = await prisma.program.findUnique({ where: { id: programId } })
    if (!program || program.status !== "ACTIVE") {
      return NextResponse.json({ error: "Program aktif değil." }, { status: 400 })
    }
  }

  const application = await prisma.application.create({
    data: {
      ...rest,
      categories: rest.categories ?? [],
      status:     "DRAFT",
      userId:     session.user.id,
      ...(periodId  ? { periodId }  : {}),
      ...(programId ? { programId } : {}),
    },
  })

  return NextResponse.json(application, { status: 201 })
}

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
      period:  { select: { title: true, endDate: true } },
      program: { select: { title: true, endDate: true } },
      _count:  { select: { files: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(applications)
}

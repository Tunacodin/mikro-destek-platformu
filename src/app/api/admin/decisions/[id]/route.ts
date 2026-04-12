import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  strategicReason:      z.string().optional(),
  expectedOutputs:      z.string().optional(),
  supportDuration:      z.string().optional(),
  additionalConditions: z.string().optional(),
  riskFramework:        z.string().optional(),
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

  const decision = await prisma.supportDecision.findUnique({ where: { id } })
  if (!decision) {
    return NextResponse.json({ error: "Karar bulunamadı." }, { status: 404 })
  }

  const updated = await prisma.supportDecision.update({
    where: { id },
    data: {
      strategicReason:      parsed.data.strategicReason      ?? decision.strategicReason,
      expectedOutputs:      parsed.data.expectedOutputs      ?? decision.expectedOutputs,
      supportDuration:      parsed.data.supportDuration      ?? decision.supportDuration,
      additionalConditions: parsed.data.additionalConditions ?? decision.additionalConditions,
      riskFramework:        parsed.data.riskFramework        ?? decision.riskFramework,
    },
  })

  return NextResponse.json(updated)
}

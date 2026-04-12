import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import type { ProgramStatus } from "@prisma/client"

const schema = z.object({
  status: z.enum(["DRAFT", "ACTIVE", "CLOSED"]),
})

const VALID_TRANSITIONS: Record<ProgramStatus, ProgramStatus[]> = {
  DRAFT:  ["ACTIVE"],
  ACTIVE: ["CLOSED"],
  CLOSED: [],
}

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

  const program = await prisma.program.findUnique({ where: { id } })
  if (!program) {
    return NextResponse.json({ error: "Program bulunamadı." }, { status: 404 })
  }

  const allowed = VALID_TRANSITIONS[program.status]
  if (!allowed.includes(parsed.data.status)) {
    return NextResponse.json(
      { error: `${program.status} → ${parsed.data.status} geçişi geçersiz.` },
      { status: 400 }
    )
  }

  const updated = await prisma.program.update({
    where: { id },
    data: { status: parsed.data.status },
  })

  return NextResponse.json(updated)
}

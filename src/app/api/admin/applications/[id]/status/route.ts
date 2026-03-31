import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import type { ApplicationStatus } from "@prisma/client"

const schema = z.object({
  status: z.enum(["IN_REVIEW", "EVALUATED", "SUPPORTED", "REJECTED"]),
})

const VALID_TRANSITIONS: Partial<Record<ApplicationStatus, ApplicationStatus[]>> = {
  SUBMITTED: ["IN_REVIEW"],
  IN_REVIEW: ["EVALUATED"],
  EVALUATED: ["SUPPORTED", "REJECTED"],
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

  const application = await prisma.application.findUnique({ where: { id } })
  if (!application) {
    return NextResponse.json({ error: "Bulunamadı." }, { status: 404 })
  }

  const allowed = VALID_TRANSITIONS[application.status] ?? []
  if (!allowed.includes(parsed.data.status)) {
    return NextResponse.json(
      { error: `${application.status} → ${parsed.data.status} geçişi geçersiz.` },
      { status: 400 }
    )
  }

  const updated = await prisma.application.update({
    where: { id },
    data: { status: parsed.data.status },
  })

  return NextResponse.json(updated)
}

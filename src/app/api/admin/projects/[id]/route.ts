import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  status:         z.enum(["ACTIVE", "CLOSED"]).optional(),
  supportEndDate: z.string().datetime().nullable().optional(),
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

  const project = await prisma.project.findUnique({ where: { id } })
  if (!project) {
    return NextResponse.json({ error: "Proje bulunamadı." }, { status: 404 })
  }

  const updateData: Record<string, unknown> = {}
  if (parsed.data.status !== undefined)         updateData.status = parsed.data.status
  if (parsed.data.supportEndDate !== undefined) {
    updateData.supportEndDate = parsed.data.supportEndDate
      ? new Date(parsed.data.supportEndDate)
      : null
  }

  const updated = await prisma.project.update({ where: { id }, data: updateData })

  await prisma.auditLog.create({
    data: {
      action: "PROJECT_UPDATED",
      metadata: { projectId: id, ...parsed.data },
      userId: session.user.id,
    },
  })

  return NextResponse.json(updated)
}

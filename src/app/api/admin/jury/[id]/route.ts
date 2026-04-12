import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  juryTitle: z.string().optional(),
  juryOrganization: z.string().optional(),
  juryExpertise: z.array(z.string()).optional(),
  juryBio: z.string().optional(),
  juryActive: z.boolean().optional(),
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
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id }, select: { role: true } })
  if (!user || user.role !== "JURY") {
    return NextResponse.json({ error: "Jüri üyesi bulunamadı." }, { status: 404 })
  }

  const updated = await prisma.user.update({
    where: { id },
    data: parsed.data,
  })

  return NextResponse.json(updated)
}

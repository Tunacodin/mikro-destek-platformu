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
})

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== "JURY") {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true, email: true,
      juryTitle: true, juryOrganization: true,
      juryExpertise: true, juryBio: true,
    },
  })

  return NextResponse.json(user)
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "JURY") {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 })
  }

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: parsed.data,
  })

  return NextResponse.json(updated)
}

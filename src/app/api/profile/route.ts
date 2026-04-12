import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const profileSchema = z.object({
  name:               z.string().min(2).optional(),
  phone:              z.string().optional(),
  educationStatus:    z.string().optional(),
  department:         z.string().optional(),
  address:            z.string().optional(),
  communityProfileUrl:z.string().optional(),
  linkedinUrl:        z.string().optional(),
  twitterUrl:         z.string().optional(),
})

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 })

  const body = await req.json()
  const parsed = profileSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: parsed.data,
    select: {
      name: true, phone: true, educationStatus: true,
      department: true, address: true, communityProfileUrl: true,
      linkedinUrl: true, twitterUrl: true,
    },
  })

  return NextResponse.json(updated)
}

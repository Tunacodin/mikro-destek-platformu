import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(2, "Ad soyad en az 2 karakter olmalı.").max(100),
})

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Oturum açılmamış." }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: parsed.data.name.trim() },
  })

  return NextResponse.json({ ok: true })
}

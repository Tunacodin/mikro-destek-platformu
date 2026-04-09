import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import bcrypt from "bcryptjs"

const schema = z.object({
  password: z.string().min(6, "Şifre en az 6 karakter olmalı"),
})

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Oturum açılmamış." }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12)

  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash },
  })

  return NextResponse.json({ ok: true })
}

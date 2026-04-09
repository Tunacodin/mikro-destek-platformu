import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import bcrypt from "bcryptjs"

const schema = z.object({
  name:     z.string().min(2, "İsim en az 2 karakter olmalı"),
  email:    z.string().email("Geçerli bir e-posta giriniz"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı"),
  role:     z.enum(["ADMIN", "APPLICANT", "JURY"]),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { name, email, password, role } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: "Bu e-posta adresi zaten kullanımda." }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
      onboardingCompleted: role !== "APPLICANT",
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })

  await prisma.auditLog.create({
    data: {
      action: "USER_CREATED",
      metadata: { userId: user.id, email, role },
      userId: session.user.id,
    },
  })

  return NextResponse.json(user, { status: 201 })
}

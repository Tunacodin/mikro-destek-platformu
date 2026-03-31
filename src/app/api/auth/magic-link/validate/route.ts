import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({ token: z.string().min(1) })

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz token." }, { status: 400 })
  }

  const { token } = parsed.data

  const record = await prisma.magicLinkToken.findUnique({ where: { token } })

  if (!record) {
    return NextResponse.json({ error: "Bu davet bağlantısı geçersiz." }, { status: 404 })
  }

  if (record.usedAt) {
    return NextResponse.json(
      { error: "Bu davet bağlantısı daha önce kullanılmış." },
      { status: 410 }
    )
  }

  if (record.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Bu davet bağlantısının süresi dolmuş. Yöneticinizden yeni davet isteyin." },
      { status: 410 }
    )
  }

  // Token geçerli — kullanıldı olarak işaretle
  await prisma.magicLinkToken.update({
    where: { token },
    data: { usedAt: new Date() },
  })

  // Kullanıcı yoksa JURY rolüyle oluştur
  let user = await prisma.user.findUnique({ where: { email: record.email } })
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: record.email,
        role: "JURY",
        onboardingCompleted: false,
        // passwordHash yok — magic link ile giriş yapar
      },
    })
  } else if (user.role !== "JURY") {
    // Farklı rol varsa jüriye yükselt (edge case)
    user = await prisma.user.update({
      where: { id: user.id },
      data: { role: "JURY" },
    })
  }

  return NextResponse.json({ email: record.email, userId: user.id })
}

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { sendJuryInviteEmail } from "@/lib/email"
import { z } from "zod"
import { randomUUID } from "crypto"

const schema = z.object({
  email: z.string().email("Geçerli bir e-posta giriniz"),
  name: z.string().optional(),
})

const EXPIRES_DAYS = 7

export async function POST(req: NextRequest) {
  // Yalnızca ADMIN erişebilir
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { email, name } = parsed.data

  // Zaten JURY rolüyle kayıtlıysa uyar
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing && existing.role === "JURY") {
    return NextResponse.json(
      { error: "Bu e-posta adresi zaten jüri üyesi olarak kayıtlı." },
      { status: 409 }
    )
  }

  // Kullanılmamış eski token varsa iptal et (yeni token çıkar)
  await prisma.magicLinkToken.updateMany({
    where: { email, usedAt: null },
    data: { usedAt: new Date() }, // "geçersiz kıl"
  })

  const token = randomUUID()
  const expiresAt = new Date(Date.now() + EXPIRES_DAYS * 24 * 60 * 60 * 1000)

  await prisma.magicLinkToken.create({
    data: { token, email, expiresAt },
  })

  const baseUrl = process.env.AUTH_URL ?? "http://localhost"
  const magicLink = `${baseUrl}/auth/magic-link?token=${token}`

  // E-posta gönder (RESEND_API_KEY yoksa geliştirmede log'a yaz)
  if (process.env.RESEND_API_KEY) {
    await sendJuryInviteEmail({ to: email, name, magicLink, expiresInDays: EXPIRES_DAYS })
  } else {
    console.log(`[jury-invite] Magic link (e-posta gönderilmedi): ${magicLink}`)
  }

  return NextResponse.json({
    message: "Davet gönderildi.",
    // Geliştirme ortamında link'i de döndür
    ...(process.env.NODE_ENV === "development" && { devLink: magicLink }),
  })
}

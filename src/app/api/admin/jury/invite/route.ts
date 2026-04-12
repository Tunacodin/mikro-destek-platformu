import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { sendJuryInviteEmail } from "@/lib/email"
import { z } from "zod"
import { randomUUID } from "crypto"

const schema = z.object({
  email: z.string().email("Geçerli bir e-posta giriniz"),
  name: z.string().optional(),
  juryTitle: z.string().optional(),
  juryOrganization: z.string().optional(),
  juryExpertise: z.array(z.string()).optional(),
  juryBio: z.string().optional(),
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

  const { email, name, juryTitle, juryOrganization, juryExpertise, juryBio } = parsed.data

  // Zaten JURY rolüyle kayıtlıysa uyar
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing && existing.role === "JURY") {
    return NextResponse.json(
      { error: "Bu e-posta adresi zaten jüri üyesi olarak kayıtlı." },
      { status: 409 }
    )
  }

  // Mevcut kullanıcı varsa jüri alanlarını güncelle, yoksa magic link ile oluşturulacak
  if (existing) {
    await prisma.user.update({
      where: { email },
      data: {
        role: "JURY",
        name: name || existing.name,
        juryTitle, juryOrganization,
        juryExpertise: juryExpertise ?? [],
        juryBio,
      },
    })
  }

  // Kullanılmamış eski token varsa iptal et (yeni token çıkar)
  await prisma.magicLinkToken.updateMany({
    where: { email, usedAt: null },
    data: { usedAt: new Date() }, // "geçersiz kıl"
  })

  const token = randomUUID()
  const expiresAt = new Date(Date.now() + EXPIRES_DAYS * 24 * 60 * 60 * 1000)

  await prisma.magicLinkToken.create({
    data: {
      token, email, name: name ?? null, expiresAt,
      metadata: JSON.stringify({ juryTitle, juryOrganization, juryExpertise, juryBio }),
    },
  })

  const baseUrl = (process.env.AUTH_URL ?? "http://localhost").replace(/\/$/, "")
  const magicLink = `${baseUrl}/magic-link?token=${token}`

  // E-posta gönder
  let emailError: string | null = null
  if (process.env.RESEND_API_KEY) {
    try {
      await sendJuryInviteEmail({ to: email, name, magicLink, expiresInDays: EXPIRES_DAYS })
    } catch (err) {
      emailError = err instanceof Error ? err.message : "E-posta gönderilemedi."
      console.error("[jury-invite] E-posta hatası:", emailError)
    }
  } else {
    console.log(`[jury-invite] RESEND_API_KEY yok. Magic link: ${magicLink}`)
  }

  return NextResponse.json({
    message: emailError ? "Davet oluşturuldu fakat e-posta gönderilemedi." : "Davet gönderildi.",
    magicLink, // Her zaman döndür (UI'da gösterilebilir veya log'lanabilir)
    ...(emailError && { emailError }),
  })
}

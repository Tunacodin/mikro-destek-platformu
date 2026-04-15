import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { registerSchema } from "@/lib/validations/auth.schema"

// Circle API üyelik doğrulaması
// Kullanıcının e-postası Circle topluluğunda kayıtlı olmalıdır.
async function verifyCircleMembership(email: string): Promise<boolean> {
  const token = process.env.CIRCLE_API_TOKEN
  const communityId = process.env.CIRCLE_COMMUNITY_ID

  // Token set edilmişse her zaman doğrulama yap (dev/prod fark etmez)
  // Token hiç set edilmemişse geliştirme modunda geç (production'da engelle)
  if (!token) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[register] CIRCLE_API_TOKEN eksik — geliştirme modunda doğrulama atlanıyor")
      return true
    }
    console.error("[register] CIRCLE_API_TOKEN tanımlı değil")
    return false
  }

  if (!communityId) {
    console.error("[register] CIRCLE_COMMUNITY_ID tanımlı değil")
    return false
  }

  try {
    // Circle API v1 — tüm sayfalarda email ara (max 100/sayfa)
    const PER_PAGE = 100
    let page = 1

    while (true) {
      const url = new URL("https://app.circle.so/api/v1/community_members")
      url.searchParams.set("community_id", communityId)
      url.searchParams.set("per_page", String(PER_PAGE))
      url.searchParams.set("page", String(page))

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(8000),
      })

      if (!res.ok) {
        console.error(`[register] Circle API ${res.status}: ${await res.text()}`)
        return false
      }

      const data = await res.json()

      if (!Array.isArray(data) || data.length === 0) break

      // Bu sayfada email var mı?
      const found = data.some((member: { email?: string }) =>
        member.email?.toLowerCase() === email.toLowerCase()
      )
      if (found) return true

      // Sonraki sayfaya gerek yok mu?
      if (data.length < PER_PAGE) break
      page++
    }

    return false
  } catch (err) {
    console.error("[register] Circle API erişim hatası:", err)
    return false
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Zod ile doğrulama (passwordConfirm istemci tarafında kontrol edildiği için
    // burada sadece name, email, password beklenir)
    const parsed = registerSchema.safeParse({
      ...body,
      passwordConfirm: body.password, // API çağrısında tekrar gerekmez
    })

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { name, email, password } = parsed.data

    // İş kuralı: yalnızca Circle üyeleri kayıt olabilir
    const isMember = await verifyCircleMembership(email)
    if (!isMember) {
      return NextResponse.json(
        {
          error:
            "Bu e-posta adresi Circle topluluğumuzda kayıtlı değil. Lütfen üyelik e-postanızı kullanın.",
        },
        { status: 403 }
      )
    }

    // Mevcut kullanıcı kontrolü
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: "Bu e-posta adresi zaten kayıtlı." },
        { status: 409 }
      )
    }

    // Şifreyi hashle
    const passwordHash = await bcrypt.hash(password, 12)

    // Kullanıcı oluştur (varsayılan rol: APPLICANT)
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "APPLICANT",
        onboardingCompleted: false,
      },
    })

    return NextResponse.json(
      { message: "Kayıt başarılı. Giriş yapabilirsiniz." },
      { status: 201 }
    )
  } catch (error) {
    console.error("[register] Hata:", error)
    return NextResponse.json(
      { error: "Sunucu hatası. Lütfen tekrar deneyin." },
      { status: 500 }
    )
  }
}

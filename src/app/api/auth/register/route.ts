import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { registerSchema } from "@/lib/validations/auth.schema"

// Circle API üyelik doğrulaması
// Kullanıcının e-postası Circle topluluğunda kayıtlı olmalıdır.
async function verifyCircleMembership(email: string): Promise<boolean> {
  const token = process.env.CIRCLE_API_TOKEN
  const communityId = process.env.CIRCLE_COMMUNITY_ID

  // Geliştirme ortamında Circle doğrulaması atlanabilir
  if (!token || !communityId) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[register] CIRCLE_API_TOKEN veya CIRCLE_COMMUNITY_ID eksik — doğrulama atlanıyor")
      return true
    }
    console.error("[register] CIRCLE_API_TOKEN veya CIRCLE_COMMUNITY_ID tanımlı değil")
    return false
  }

  try {
    // Circle API v1 — community_members endpoint
    const url = new URL("https://app.circle.so/api/v1/community_members")
    url.searchParams.set("community_id", communityId)
    url.searchParams.set("email", email)

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
      // 5 saniye timeout
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) {
      console.error(`[register] Circle API ${res.status}: ${await res.text()}`)
      return false
    }

    const data = await res.json()

    // Circle API yanıtı: aktif üyeler dizisi
    if (!Array.isArray(data)) return false

    // Üye var mı ve aktif mi kontrolü
    return data.some((member: { email?: string; public_uid?: string }) =>
      member.email?.toLowerCase() === email.toLowerCase()
    )
  } catch (err) {
    console.error("[register] Circle API erişim hatası:", err)
    // Timeout veya ağ hatasında üretimde false döndür
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

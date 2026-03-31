import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@mikrodestekfonu.com"
  const password = process.env.SEED_ADMIN_PASSWORD ?? "Admin1234!"
  const name = process.env.SEED_ADMIN_NAME ?? "Platform Yöneticisi"

  // Zaten varsa atla
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log(`[seed] Admin kullanıcısı zaten mevcut: ${email}`)
    return
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: "ADMIN",
      onboardingCompleted: true, // Admin onboarding'e girmez
    },
  })

  console.log(`[seed] Admin kullanıcısı oluşturuldu: ${email}`)
}

main()
  .catch((e) => {
    console.error("[seed] Hata:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

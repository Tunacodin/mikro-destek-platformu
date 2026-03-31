"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

export async function completeOnboarding() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  await prisma.user.update({
    where: { id: session.user.id },
    data: { onboardingCompleted: true },
  })

  // JWT token client tarafında useSession().update() ile yenilenecek.
  // Bu fonksiyon yalnızca DB'yi günceller.
}

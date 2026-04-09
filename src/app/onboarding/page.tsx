import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { OnboardingClient } from "./OnboardingClient"

export const metadata = { title: "Hoş Geldiniz — Mikro Destek Fonu" }

export default async function OnboardingPage() {
  const session = await auth()
  if (!session) redirect("/login")

  // Onboarding tamamlanmışsa ilgili dashboard'a yönlendir
  if (session.user.onboardingCompleted) {
    const home = session.user.role === "ADMIN"
      ? "/admin/dashboard"
      : session.user.role === "JURY"
      ? "/jury/dashboard"
      : "/dashboard"
    redirect(home)
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  })

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <OnboardingClient
        role={session.user.role}
        name={session.user.name ?? session.user.email ?? ""}
        needsPassword={!user?.passwordHash}
      />
    </div>
  )
}

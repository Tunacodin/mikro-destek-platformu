import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { OnboardingClient } from "./OnboardingClient"

export const metadata = { title: "Hoş Geldiniz — Mikro Destek Fonu" }

export default async function OnboardingPage() {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <OnboardingClient
        role={session.user.role}
        name={session.user.name ?? session.user.email ?? ""}
      />
    </div>
  )
}

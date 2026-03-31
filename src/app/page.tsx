import { auth } from "@/auth"
import { redirect } from "next/navigation"
import type { Role } from "@prisma/client"

const ROLE_HOME: Record<Role, string> = {
  ADMIN: "/admin/dashboard",
  APPLICANT: "/dashboard",
  JURY: "/jury/dashboard",
}

export default async function RootPage() {
  const session = await auth()

  if (!session) redirect("/login")
  if (!session.user.onboardingCompleted) redirect("/onboarding")

  const target = ROLE_HOME[session.user.role] ?? "/login"
  redirect(target)
}

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { JuryShell } from "@/components/layout/JuryShell"

export default async function JuryLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || session.user.role !== "JURY") redirect("/login")

  return (
    <JuryShell userName={session.user.name ?? session.user.email ?? ""}>
      {children}
    </JuryShell>
  )
}

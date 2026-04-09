import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { ApplicantShell } from "@/components/layout/ApplicantShell"

export default async function ApplicantLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || session.user.role !== "APPLICANT") redirect("/login")

  return (
    <ApplicantShell userName={session.user.name ?? session.user.email ?? ""}>
      {children}
    </ApplicantShell>
  )
}

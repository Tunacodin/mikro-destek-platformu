import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { AdminShell } from "@/components/layout/AdminShell"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") redirect("/login")

  return (
    <AdminShell userName={session.user.name ?? session.user.email ?? ""}>
      {children}
    </AdminShell>
  )
}

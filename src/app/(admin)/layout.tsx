import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/layout/AdminSidebar"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") redirect("/login")

  return (
    <div className="flex h-screen bg-[#f6f7f9]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b bg-white flex items-center justify-between px-7 shrink-0">
          <span className="text-base font-semibold text-foreground">Mikro Destek Fonu</span>
          <span className="text-base text-muted-foreground">
            {session.user.name ?? session.user.email}
          </span>
        </header>
        <main className="flex-1 overflow-auto p-7">{children}</main>
      </div>
    </div>
  )
}

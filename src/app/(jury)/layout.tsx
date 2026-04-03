import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { JuryNav } from "@/components/layout/JuryNav"

export default async function JuryLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || session.user.role !== "JURY") redirect("/login")

  return (
    <div className="flex h-screen bg-[#f5f5f5]">
      <JuryNav />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white/90 backdrop-blur-sm border-b border-black/[0.06] flex items-center justify-between px-6 shrink-0 sticky top-0 z-10">
          <span className="text-[13px] font-semibold text-[#1c1c1c] tracking-tight">
            Mikro Destek Fonu
          </span>
          <span className="text-[12px] text-[#6e6e73]">
            {session.user.name ?? session.user.email}
          </span>
        </header>
        <main className="flex-1 overflow-auto p-8">{children}</main>
      </div>
    </div>
  )
}

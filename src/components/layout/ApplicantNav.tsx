"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, FilePlus, FileText, LogOut } from "lucide-react"
import { signOut, useSession } from "next-auth/react"

const links = [
  { href: "/dashboard",              label: "Panelim",        icon: LayoutDashboard, exact: true },
  { href: "/dashboard/apply",        label: "Yeni Başvuru",   icon: FilePlus,        exact: false },
  { href: "/dashboard/applications", label: "Başvurularım",   icon: FileText,        exact: false },
]

export function ApplicantNav() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const initials = session?.user?.name
    ? session.user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?"

  return (
    <aside className="w-[216px] bg-[#212121] flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-4 pt-5 pb-3">
        <div className="bg-white rounded-xl px-3 py-2 inline-flex">
          <Image src="/logo.png" alt="Divizyon" width={96} height={24} priority />
        </div>
      </div>

      {/* Rol */}
      <div className="px-5 pb-3">
        <span className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.12em]">
          Başvuru Sahibi
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {links.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all",
                isActive
                  ? "bg-[#fab758] text-[#1c1c1c]"
                  : "text-white/55 hover:text-white hover:bg-white/[0.07]"
              )}
            >
              <Icon className={cn("h-[15px] w-[15px] shrink-0", isActive ? "opacity-80" : "")} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Kullanıcı + Çıkış */}
      <div className="px-3 pt-3 pb-4 border-t border-white/[0.07] space-y-0.5">
        {session?.user && (
          <div className="flex items-center gap-2.5 px-3 py-2.5">
            <div className="w-7 h-7 rounded-full bg-[#fab758]/20 ring-1 ring-[#fab758]/30 flex items-center justify-center shrink-0">
              <span className="text-[11px] font-semibold text-[#fab758]">{initials}</span>
            </div>
            <div className="min-w-0">
              <span className="text-[12px] text-white/55 truncate leading-none block">
                {session.user.name ?? session.user.email}
              </span>
            </div>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] text-white/45 hover:text-white/80 hover:bg-white/[0.07] transition-all"
        >
          <LogOut className="h-[15px] w-[15px] shrink-0" />
          Çıkış Yap
        </button>
      </div>
    </aside>
  )
}

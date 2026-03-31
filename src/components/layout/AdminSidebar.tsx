"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  CalendarRange,
  FileText,
  Users,
  FolderKanban,
  LogOut,
} from "lucide-react"
import { signOut } from "next-auth/react"

const links = [
  { href: "/admin/dashboard",    label: "Genel Bakış",       icon: LayoutDashboard },
  { href: "/admin/periods",      label: "Başvuru Dönemleri", icon: CalendarRange },
  { href: "/admin/applications", label: "Başvurular",        icon: FileText },
  { href: "/admin/jury",         label: "Jüri Yönetimi",     icon: Users },
  { href: "/admin/projects",     label: "Projeler",          icon: FolderKanban },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-[#212121] flex flex-col shrink-0">
      <div className="px-5 py-5 border-b border-white/10">
        <Image src="/logo-light.png" alt="Divizyon" width={110} height={28} priority />
        <p className="text-white/40 text-xs mt-3">Program Yöneticisi</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#fab758] text-[#212121]"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Çıkış Yap
        </button>
      </div>
    </aside>
  )
}

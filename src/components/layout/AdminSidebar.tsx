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
  UserCog,
  LogOut,
  X,
} from "lucide-react"
import { signOut } from "next-auth/react"

const links = [
  { href: "/admin/dashboard",    label: "Genel Bakış",       icon: LayoutDashboard },
  { href: "/admin/periods",      label: "Başvuru Dönemleri", icon: CalendarRange },
  { href: "/admin/applications", label: "Başvurular",        icon: FileText },
  { href: "/admin/jury",         label: "Jüri Yönetimi",     icon: Users },
  { href: "/admin/projects",     label: "Projeler",          icon: FolderKanban },
  { href: "/admin/users",        label: "Kullanıcılar",      icon: UserCog },
]

export function AdminSidebar({
  collapsed = false,
  onClose,
}: {
  collapsed?: boolean
  onClose?: () => void
}) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        "h-full bg-[#212121] flex flex-col shrink-0 transition-all duration-300",
        collapsed ? "w-[60px]" : "w-64 lg:w-[220px]"
      )}
    >
      {/* Logo + kapat */}
      <div className={cn(
        "flex items-center shrink-0 pt-5 pb-4",
        collapsed ? "justify-center px-0" : "justify-between px-4"
      )}>
        {!collapsed && (
          <div className="bg-white rounded-xl px-3 py-2 inline-flex">
            <Image src="/logo.png" alt="Divizyon" width={96} height={24} priority />
          </div>
        )}
        {collapsed && (
          <div className="w-9 h-9 rounded-xl bg-[#fab758]/20 flex items-center justify-center">
            <span className="text-[12px] font-bold text-[#fab758]">D</span>
          </div>
        )}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Menüyü Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>


      {/* Nav */}
      <nav className={cn("flex-1 py-1 space-y-0.5", collapsed ? "px-1.5" : "px-3")}>
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center rounded-xl text-[13px] font-medium transition-all duration-150 cursor-pointer",
                collapsed
                  ? "justify-center w-9 h-9 mx-auto"
                  : "gap-2.5 px-3 py-2.5",
                isActive
                  ? "bg-[#fab758] text-[#1c1c1c]"
                  : "text-white/55 hover:text-white hover:bg-white/[0.07]"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && label}
            </Link>
          )
        })}
      </nav>

      {/* Çıkış */}
      <div className={cn(
        "pt-3 pb-4 border-t border-white/[0.07]",
        collapsed ? "px-1.5" : "px-3"
      )}>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          title={collapsed ? "Çıkış Yap" : undefined}
          className={cn(
            "flex items-center rounded-xl text-[13px] text-white/45 hover:text-white/80 hover:bg-white/[0.07] transition-all duration-150 cursor-pointer",
            collapsed
              ? "justify-center w-9 h-9 mx-auto"
              : "w-full gap-2.5 px-3 py-2.5"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && "Çıkış Yap"}
        </button>
      </div>
    </aside>
  )
}

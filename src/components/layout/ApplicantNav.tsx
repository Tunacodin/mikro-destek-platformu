"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, FilePlus, FileText, FolderOpen, LogOut, X, PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { signOut } from "next-auth/react"
import { NotificationBell } from "@/components/ui/NotificationBell"

const links = [
  { href: "/dashboard",              label: "Panelim",        icon: LayoutDashboard, exact: true },
  { href: "/dashboard/apply",        label: "Yeni Başvuru",   icon: FilePlus,        exact: false },
  { href: "/dashboard/applications", label: "Başvurularım",   icon: FileText,        exact: false },
  { href: "/dashboard/projects",     label: "Desteklerim",     icon: FolderOpen,      exact: false },
]

export function ApplicantNav({
  collapsed = false,
  userName,
  onCollapse,
  onClose,
}: {
  collapsed?: boolean
  userName: string
  onCollapse?: () => void
  onClose?: () => void
}) {
  const pathname = usePathname()

  const initials = userName
    ? userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?"
  const firstName = userName?.split(" ")[0] ?? ""

  return (
    <aside
      className={cn(
        "h-full bg-white border-r border-[#e8e8e8] flex flex-col shrink-0 transition-all duration-300",
        collapsed ? "w-[64px]" : "w-[240px]"
      )}
    >
      {/* Logo + Platform adı */}
      <div className={cn(
        "flex items-center shrink-0 h-[72px] border-b border-[#e8e8e8]",
        collapsed ? "justify-center px-3" : "px-5 gap-3"
      )}>
        <Image src="/divizyon-logo.png" alt="Divizyon" width={36} height={36} className="shrink-0" priority />
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-[14px] font-bold text-[#1c1c1c] leading-tight truncate">Mikro Destek Fonu</p>
            <p className="text-[12px] text-[#aeaeb2] leading-tight">Yönetim Platformu</p>
          </div>
        )}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden ml-auto w-8 h-8 rounded-lg flex items-center justify-center text-[#aeaeb2] hover:text-[#1c1c1c] hover:bg-[#f0f0f0] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className={cn("flex-1 py-3 space-y-1", collapsed ? "px-2" : "px-3")}>
        {links.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center rounded-xl text-[13px] font-medium transition-all duration-150 cursor-pointer",
                collapsed ? "justify-center w-10 h-10 mx-auto" : "gap-3 px-3.5 py-2.5",
                isActive
                  ? "bg-[#1c1c1c] text-white"
                  : "text-[#6e6e73] hover:text-[#1c1c1c] hover:bg-[#f5f5f5]"
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && label}
            </Link>
          )
        })}
      </nav>

      {/* Alt alan */}
      <div className={cn(
        "py-4 border-t border-[#e8e8e8]",
        collapsed ? "px-2 flex flex-col items-center gap-2" : "px-3"
      )}>
        {collapsed ? (
          <>
            <button onClick={() => signOut({ callbackUrl: "/login" })} title="Çıkış Yap"
              className="w-10 h-10 rounded-full bg-[#fab758]/15 ring-1 ring-[#fab758]/25 flex items-center justify-center hover:bg-[#fab758]/25 transition-colors cursor-pointer">
              <span className="text-[11px] font-bold text-[#fab758]">{initials}</span>
            </button>
            <NotificationBell dropUp openRight />
          </>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <button onClick={() => signOut({ callbackUrl: "/login" })} title="Çıkış Yap"
              className="flex items-center gap-3 min-w-0 flex-1 rounded-xl px-2.5 py-2.5 text-left hover:bg-[#f5f5f5] transition-colors cursor-pointer group">
              <div className="w-8 h-8 rounded-full bg-[#fab758]/15 ring-1 ring-[#fab758]/25 flex items-center justify-center shrink-0">
                <span className="text-[11px] font-bold text-[#fab758]">{initials}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-[#1c1c1c] truncate leading-none">{firstName}</p>
                <p className="text-[11px] text-[#aeaeb2] mt-0.5 flex items-center gap-1 group-hover:text-[#6e6e73] transition-colors">
                  <LogOut className="w-3 h-3" /> Çıkış Yap
                </p>
              </div>
            </button>
            <div className="shrink-0"><NotificationBell dropUp openRight /></div>
          </div>
        )}
      </div>
    </aside>
  )
}

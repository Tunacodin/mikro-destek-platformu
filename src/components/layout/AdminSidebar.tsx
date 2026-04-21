"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  CalendarRange,
  BookOpen,
  FileText,
  Users,
  FolderKanban,
  UserCog,
  X,
  LogOut,
} from "lucide-react"
import { signOut } from "next-auth/react"
import { NotificationBell } from "@/components/ui/NotificationBell"
import { UserProfileModal } from "@/components/ui/UserProfileModal"

const links = [
  { href: "/admin/dashboard",    label: "Genel Bakış",   icon: LayoutDashboard },
  { href: "/admin/periods",      label: "Dönemler",      icon: CalendarRange },
  { href: "/admin/programs",     label: "Programlar",    icon: BookOpen },
  { href: "/admin/applications", label: "Başvurular",    icon: FileText },
  { href: "/admin/jury",         label: "Jüri Yönetimi", icon: Users },
  { href: "/admin/projects",     label: "Desteklenen Projeler", icon: FolderKanban },
  { href: "/admin/users",        label: "Kullanıcılar",  icon: UserCog },
]

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
}

export function AdminSidebar({
  collapsed = false,
  onClose,
  userName,
  userEmail,
}: {
  collapsed?: boolean
  onClose?: () => void
  userName: string
  userEmail: string
}) {
  const pathname = usePathname()
  const initials = getInitials(userName || "A")
  const firstName = userName.split(" ")[0] ?? userName
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <>
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
        <Image src="/divizyon-logo.png" alt="Divizyon" width={36} height={36} className="shrink-0 rounded-lg" priority />
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
            aria-label="Menüyü Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className={cn("flex-1 py-3 space-y-1", collapsed ? "px-2" : "px-3")}>
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
                  ? "justify-center w-10 h-10 mx-auto"
                  : "gap-3 px-3.5 py-2.5",
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

      {/* Alt alan: kullanıcı adı + bildirimler */}
      <div className={cn(
        "py-4 border-t border-[#e8e8e8]",
        collapsed ? "px-2 flex flex-col items-center gap-2" : "px-3"
      )}>
        {collapsed ? (
          <>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              title={userName}
              className="w-10 h-10 rounded-full bg-[#fab758]/15 ring-1 ring-[#fab758]/25 flex items-center justify-center hover:bg-[#fab758]/25 transition-colors cursor-pointer"
            >
              <span className="text-[11px] font-bold text-[#fab758]">{initials}</span>
            </button>
            <NotificationBell dropUp openRight />
          </>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <div ref={menuRef} className="relative flex-1 min-w-0">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-3 w-full min-w-0 rounded-xl px-2.5 py-2.5 text-left hover:bg-[#f5f5f5] transition-colors cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full bg-[#fab758]/15 ring-1 ring-[#fab758]/25 flex items-center justify-center shrink-0">
                  <span className="text-[11px] font-bold text-[#fab758]">{initials}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-[#1c1c1c] truncate leading-none">{firstName}</p>
                  <p className="text-[11px] text-[#aeaeb2] mt-0.5">Yönetici</p>
                </div>
              </button>

              {menuOpen && (
                <div className="absolute bottom-[calc(100%+4px)] left-0 w-full bg-white border border-[#e8e8e8] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] overflow-hidden z-50">
                  <button
                    onClick={() => { setMenuOpen(false); setProfileOpen(true) }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] text-[#1c1c1c] hover:bg-[#f5f5f5] transition-colors cursor-pointer"
                  >
                    <UserCog className="w-4 h-4 text-[#aeaeb2]" />
                    Hesap Ayarları
                  </button>
                  <div className="h-px bg-[#e8e8e8]" />
                  <Link
                    href="/admin/users"
                    onClick={() => setMenuOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] text-[#1c1c1c] hover:bg-[#f5f5f5] transition-colors cursor-pointer"
                  >
                    <UserCog className="w-4 h-4 text-[#aeaeb2]" />
                    Kullanıcı Yönetimi
                  </Link>
                  <div className="h-px bg-[#e8e8e8]" />
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Çıkış Yap
                  </button>
                </div>
              )}
            </div>
            <div className="shrink-0"><NotificationBell dropUp openRight /></div>
          </div>
        )}
      </div>
    </aside>

    <UserProfileModal
      isOpen={profileOpen}
      onClose={() => setProfileOpen(false)}
      userName={userName}
      userEmail={userEmail}
    />
    </>
  )
}

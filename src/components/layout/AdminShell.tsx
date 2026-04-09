"use client"

import { useState } from "react"
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { AdminSidebar } from "./AdminSidebar"
import { NotificationBell } from "@/components/ui/NotificationBell"

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
}

export function AdminShell({
  children,
  userName,
}: {
  children: React.ReactNode
  userName: string
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const initials = getInitials(userName)

  return (
    <div className="flex h-screen bg-[#f5f5f5]">
      {/* Mobil overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block shrink-0">
        <AdminSidebar collapsed={collapsed} />
      </div>

      {/* Mobil drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <AdminSidebar collapsed={false} onClose={() => setMobileOpen(false)} />
      </div>

      {/* Ana içerik */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-14 bg-white/90 backdrop-blur-sm border-b border-black/[0.06] flex items-center justify-between px-4 sm:px-6 shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-1.5 rounded-lg hover:bg-[#f0f0f0] transition-colors cursor-pointer"
              onClick={() => setMobileOpen(true)}
              aria-label="Menüyü Aç"
            >
              <Menu className="w-5 h-5 text-[#1c1c1c]" />
            </button>
            {/* Desktop collapse toggle */}
            <button
              className="hidden lg:flex items-center justify-center p-1.5 rounded-lg text-[#aeaeb2] hover:text-[#1c1c1c] hover:bg-[#f0f0f0] transition-colors cursor-pointer"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? "Sidebar'ı Aç" : "Sidebar'ı Kapat"}
            >
              {collapsed
                ? <PanelLeftOpen className="w-4 h-4" />
                : <PanelLeftClose className="w-4 h-4" />
              }
            </button>
            <span className="text-[13px] font-semibold text-[#1c1c1c] tracking-tight">
              Mikro Destek Fonu
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <NotificationBell />
            <span className="text-[12px] text-[#6e6e73] truncate max-w-[140px] hidden sm:block">
              {userName}
            </span>
            <div className="w-7 h-7 rounded-full bg-[#fab758]/20 ring-1 ring-[#fab758]/30 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-[#fab758]">{initials}</span>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 sm:p-7">{children}</main>
      </div>
    </div>
  )
}

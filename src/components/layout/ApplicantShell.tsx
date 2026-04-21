"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import { ApplicantNav } from "./ApplicantNav"

export function ApplicantShell({
  children,
  userName,
  userEmail,
}: {
  children: React.ReactNode
  userName: string
  userEmail: string
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen bg-[#fafafa]">
      {/* Mobil overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block shrink-0">
        <ApplicantNav
          collapsed={collapsed}
          onCollapse={() => setCollapsed((c) => !c)}
          userName={userName}
          userEmail={userEmail}
        />
      </div>

      {/* Mobil drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <ApplicantNav
          collapsed={false}
          userName={userName}
          userEmail={userEmail}
          onClose={() => setMobileOpen(false)}
        />
      </div>

      {/* Mobil hamburger */}
      <button
        className="lg:hidden fixed top-4 left-4 z-30 w-9 h-9 bg-white border border-black/[0.08] rounded-xl flex items-center justify-center shadow-sm cursor-pointer"
        onClick={() => setMobileOpen(true)}
        aria-label="Menüyü Aç"
      >
        <Menu className="w-4 h-4 text-[#1c1c1c]" />
      </button>

      {/* Ana içerik */}
      <main className="flex-1 overflow-auto p-6 sm:p-8 lg:p-10 min-w-0">
        {children}
      </main>
    </div>
  )
}

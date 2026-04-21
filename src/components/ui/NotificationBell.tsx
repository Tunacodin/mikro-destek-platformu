"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Bell } from "lucide-react"

type Notif = {
  id: string
  title: string
  message: string
  link: string | null
  read: boolean
  createdAt: string
}

export function NotificationBell({ dropUp = false, dark = false, openRight = false }: { dropUp?: boolean; dark?: boolean; openRight?: boolean }) {
  const [notifications, setNotifications] = useState<Notif[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setNotifications(data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const unread = notifications.filter((n) => !n.read).length

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "PATCH" })
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  async function handleNotifClick(n: Notif) {
    if (!n.read) {
      await fetch(`/api/notifications/${n.id}`, { method: "PATCH" })
      setNotifications((prev) => prev.map((p) => p.id === n.id ? { ...p, read: true } : p))
    }
    if (n.link) {
      setOpen(false)
      router.push(n.link)
    }
  }

  function fmt(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`relative p-2 rounded-xl transition-colors ${
          dark
            ? "text-white/40 hover:text-white/80 hover:bg-white/[0.07]"
            : "text-[#6e6e73] hover:text-[#1c1c1c] hover:bg-[#f0f0f0]"
        }`}
        aria-label="Bildirimler"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-[#fab758] rounded-full flex items-center justify-center text-[9px] font-bold text-white leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className={`absolute w-80 bg-white border border-black/[0.08] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] z-50 overflow-hidden ${dropUp ? "bottom-[calc(100%+6px)]" : "top-[calc(100%+6px)]"} ${openRight ? "left-0" : "right-0"}`}>
          {/* Başlık */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.06]">
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-semibold text-[#1c1c1c]">Bildirimler</p>
              {unread > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#fab758] text-white rounded-full">
                  {unread}
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-[11px] font-medium text-[#fab758] hover:text-amber-600 transition-colors cursor-pointer"
              >
                Tümünü okundu işaretle
              </button>
            )}
          </div>

          {/* Liste */}
          <ul className="max-h-[320px] overflow-y-auto divide-y divide-black/[0.04]">
            {notifications.length === 0 ? (
              <li className="py-8 text-center">
                <Bell className="w-6 h-6 text-[#d1d1d6] mx-auto mb-2" />
                <p className="text-[12px] text-[#aeaeb2]">Henüz bildirim yok</p>
              </li>
            ) : (
              notifications.map((n) => (
                <li
                  key={n.id}
                  onClick={() => handleNotifClick(n)}
                  className={`px-4 py-3 transition-colors ${n.link ? "cursor-pointer" : ""} ${
                    n.read ? "bg-white hover:bg-[#fafafa]" : "bg-amber-50/60 hover:bg-amber-50"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {!n.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#fab758] mt-1.5 shrink-0" />
                    )}
                    <div className={n.read ? "pl-4" : ""}>
                      <p className="text-[12px] font-semibold text-[#1c1c1c] leading-snug">
                        {n.title}
                      </p>
                      <p className="text-[11px] text-[#6e6e73] mt-0.5 leading-relaxed">
                        {n.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[10px] text-[#aeaeb2]">{fmt(n.createdAt)}</p>
                        {n.link && (
                          <span className="text-[10px] font-medium text-[#fab758]">Görüntüle →</span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

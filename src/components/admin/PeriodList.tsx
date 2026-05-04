"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import type { PeriodStatus } from "@prisma/client"

type Period = {
  id: string
  title: string
  startDate: Date
  endDate: Date
  status: PeriodStatus
  _count: { applications: number }
}

const STATUS_LABELS: Record<PeriodStatus, string> = {
  DRAFT:  "Taslak",
  ACTIVE: "Aktif",
  CLOSED: "Kapalı",
}

const STATUS_STYLES: Record<PeriodStatus, string> = {
  DRAFT:  "bg-slate-100 text-slate-600",
  ACTIVE: "bg-emerald-50 text-emerald-700",
  CLOSED: "bg-red-50 text-red-600",
}

function toLocalDateTimeInput(d: Date): string {
  const date = new Date(d)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function PeriodList({ periods }: { periods: Period[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [extendingId, setExtendingId] = useState<string | null>(null)
  const [newEndDate, setNewEndDate] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const pendingRef = useRef(false)

  async function changeStatus(id: string, status: PeriodStatus) {
    if (pendingRef.current) return
    pendingRef.current = true
    setLoading(id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/periods/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? "İşlem başarısız.")
        return
      }
      router.refresh()
    } finally {
      pendingRef.current = false
      setLoading(null)
    }
  }

  function openExtend(p: Period) {
    setError(null)
    setExtendingId(p.id)
    setNewEndDate(toLocalDateTimeInput(p.endDate))
  }

  function cancelExtend() {
    setExtendingId(null)
    setNewEndDate("")
    setError(null)
  }

  async function submitExtend(id: string) {
    if (pendingRef.current || !newEndDate) return
    pendingRef.current = true
    setLoading(id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/periods/${id}/extend`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endDate: new Date(newEndDate).toISOString() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? "Uzatma başarısız.")
        return
      }
      cancelExtend()
      router.refresh()
    } finally {
      pendingRef.current = false
      setLoading(null)
    }
  }

  if (periods.length === 0) {
    return (
      <p className="text-[13px] text-[#aeaeb2] py-6 text-center">
        Henüz dönem oluşturulmamış.
      </p>
    )
  }

  const fmt = (d: Date) =>
    new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })

  const now = new Date()

  return (
    <div className="divide-y divide-black/[0.04]">
      {periods.map((p) => {
        const isExpired = p.status === "ACTIVE" && new Date(p.endDate) < now
        const isExtending = extendingId === p.id
        const isLoading = loading === p.id

        return (
          <div key={p.id} className="px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-[#1c1c1c] truncate">{p.title}</p>
                <p className="text-[12px] text-[#6e6e73] mt-0.5">
                  {fmt(p.startDate)} — {fmt(p.endDate)}
                  <span className="mx-1.5 text-[#d1d1d6]">·</span>
                  {p._count.applications} başvuru
                  {isExpired && (
                    <>
                      <span className="mx-1.5 text-[#d1d1d6]">·</span>
                      <span className="text-amber-700 font-semibold">Süresi doldu</span>
                    </>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                  isExpired ? "bg-amber-50 text-amber-700" : STATUS_STYLES[p.status]
                }`}>
                  {isExpired ? "Süresi Doldu" : STATUS_LABELS[p.status]}
                </span>

                {p.status === "DRAFT" && !isExtending && (
                  <button
                    onClick={() => changeStatus(p.id, "ACTIVE")}
                    disabled={isLoading}
                    className="text-[12px] font-semibold px-3 py-1.5 bg-[#212121] text-white rounded-xl hover:bg-[#383838] disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    {isLoading ? "…" : "Yayınla"}
                  </button>
                )}

                {p.status === "ACTIVE" && !isExpired && !isExtending && (
                  <button
                    onClick={() => changeStatus(p.id, "CLOSED")}
                    disabled={isLoading}
                    className="text-[12px] font-semibold px-3 py-1.5 bg-[#212121] text-white rounded-xl hover:bg-[#383838] disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    {isLoading ? "…" : "Kapat"}
                  </button>
                )}

                {p.status === "ACTIVE" && isExpired && !isExtending && (
                  <>
                    <button
                      onClick={() => openExtend(p)}
                      disabled={isLoading}
                      className="text-[12px] font-semibold px-3 py-1.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      Uzat
                    </button>
                    <button
                      onClick={() => changeStatus(p.id, "CLOSED")}
                      disabled={isLoading}
                      className="text-[12px] font-semibold px-3 py-1.5 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      {isLoading ? "…" : "Kapat"}
                    </button>
                  </>
                )}
              </div>
            </div>

            {isExtending && (
              <div className="mt-3 flex flex-wrap items-center gap-2 bg-emerald-50/60 border border-emerald-100 rounded-xl px-3 py-2.5">
                <label className="text-[12px] text-[#6e6e73]">Yeni bitiş:</label>
                <input
                  type="datetime-local"
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  className="text-[12px] px-2.5 py-1.5 bg-white border border-black/10 rounded-lg outline-none focus:border-emerald-500"
                />
                <button
                  onClick={() => submitExtend(p.id)}
                  disabled={isLoading || !newEndDate}
                  className="text-[12px] font-semibold px-3 py-1.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  {isLoading ? "Kaydediliyor…" : "Kaydet"}
                </button>
                <button
                  onClick={cancelExtend}
                  disabled={isLoading}
                  className="text-[12px] font-semibold px-3 py-1.5 bg-white text-[#1c1c1c] border border-black/10 rounded-xl hover:bg-[#f5f5f7] transition-colors cursor-pointer"
                >
                  Vazgeç
                </button>
              </div>
            )}

            {error && extendingId === p.id && (
              <p className="mt-2 text-[12px] text-red-600">{error}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

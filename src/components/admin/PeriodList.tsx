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

const NEXT_STATUS: Partial<Record<PeriodStatus, { label: string; status: PeriodStatus }>> = {
  DRAFT:  { label: "Yayınla", status: "ACTIVE" },
  ACTIVE: { label: "Kapat",   status: "CLOSED" },
}

export function PeriodList({ periods }: { periods: Period[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const pendingRef = useRef(false)

  async function changeStatus(id: string, status: PeriodStatus) {
    if (pendingRef.current) return
    pendingRef.current = true
    setLoading(id)
    try {
      await fetch(`/api/admin/periods/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
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

  return (
    <div className="divide-y divide-black/[0.04]">
      {periods.map((p) => {
        const next = NEXT_STATUS[p.status]
        return (
          <div key={p.id} className="px-5 py-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-[#1c1c1c] truncate">{p.title}</p>
              <p className="text-[12px] text-[#6e6e73] mt-0.5">
                {fmt(p.startDate)} — {fmt(p.endDate)}
                <span className="mx-1.5 text-[#d1d1d6]">·</span>
                {p._count.applications} başvuru
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[p.status]}`}>
                {STATUS_LABELS[p.status]}
              </span>

              {next && (
                <button
                  onClick={() => changeStatus(p.id, next.status)}
                  disabled={loading === p.id}
                  className="text-[12px] font-semibold px-3 py-1.5 bg-[#212121] text-white rounded-xl hover:bg-[#383838] disabled:opacity-40 transition-colors cursor-pointer"
                >
                  {loading === p.id ? "…" : next.label}
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

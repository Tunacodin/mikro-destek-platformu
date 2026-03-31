"use client"

import { useState } from "react"
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
  DRAFT: "Taslak",
  ACTIVE: "Aktif",
  CLOSED: "Kapalı",
}

const STATUS_COLORS: Record<PeriodStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  ACTIVE: "bg-green-100 text-green-700",
  CLOSED: "bg-red-100 text-red-700",
}

const NEXT_STATUS: Partial<Record<PeriodStatus, { label: string; status: PeriodStatus }>> = {
  DRAFT: { label: "Yayınla", status: "ACTIVE" },
  ACTIVE: { label: "Kapat", status: "CLOSED" },
}

export function PeriodList({ periods }: { periods: Period[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function changeStatus(id: string, status: PeriodStatus) {
    setLoading(id)
    try {
      await fetch(`/api/admin/periods/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      router.refresh()
    } finally {
      setLoading(null)
    }
  }

  if (periods.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 text-center">Henüz dönem oluşturulmamış.</p>
  }

  return (
    <div className="divide-y">
      {periods.map((p) => {
        const next = NEXT_STATUS[p.status]
        const fmt = (d: Date) =>
          new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })

        return (
          <div key={p.id} className="py-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{p.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {fmt(p.startDate)} — {fmt(p.endDate)} · {p._count.applications} başvuru
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[p.status]}`}>
                {STATUS_LABELS[p.status]}
              </span>

              {next && (
                <button
                  onClick={() => changeStatus(p.id, next.status)}
                  disabled={loading === p.id}
                  className="text-xs px-3 py-1 bg-[#212121] text-white rounded-md hover:bg-[#fab758] hover:text-[#212121] disabled:opacity-50 transition-colors"
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

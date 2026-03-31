"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import type { ApplicationStatus } from "@prisma/client"

type App = {
  id: string
  title: string
  status: ApplicationStatus
  submittedAt: Date | null
  user: { name: string | null; email: string }
  period: { title: string }
  _count: { files: number; juryAssignments: number }
}

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  DRAFT: "Taslak",
  SUBMITTED: "Gönderildi",
  IN_REVIEW: "İncelemede",
  EVALUATED: "Değerlendirildi",
  SUPPORTED: "Desteklendi",
  REJECTED: "Reddedildi",
}

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  SUBMITTED: "bg-blue-100 text-blue-700",
  IN_REVIEW: "bg-amber-100 text-amber-700",
  EVALUATED: "bg-purple-100 text-purple-700",
  SUPPORTED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
}

const ALL_STATUSES: ApplicationStatus[] = [
  "DRAFT", "SUBMITTED", "IN_REVIEW", "EVALUATED", "SUPPORTED", "REJECTED",
]

export function AdminApplicationList({
  applications,
  periods,
  currentStatus,
  currentPeriod,
}: {
  applications: App[]
  periods: { id: string; title: string }[]
  currentStatus?: string
  currentPeriod?: string
}) {
  const router = useRouter()
  const [movingId, setMovingId] = useState<string | null>(null)

  function filter(key: string, value: string | undefined) {
    const params = new URLSearchParams()
    if (key !== "status" && currentStatus) params.set("status", currentStatus)
    if (key !== "period" && currentPeriod) params.set("period", currentPeriod)
    if (value) params.set(key, value)
    router.push(`/admin/applications?${params.toString()}`)
  }

  async function moveToReview(id: string) {
    setMovingId(id)
    await fetch(`/api/admin/applications/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "IN_REVIEW" }),
    })
    setMovingId(null)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* Filtreler */}
      <div className="flex flex-wrap gap-2">
        <select
          value={currentStatus ?? ""}
          onChange={(e) => filter("status", e.target.value || undefined)}
          className="px-3 py-1.5 text-sm border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#fab758]"
        >
          <option value="">Tüm Durumlar</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>

        <select
          value={currentPeriod ?? ""}
          onChange={(e) => filter("period", e.target.value || undefined)}
          className="px-3 py-1.5 text-sm border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#fab758]"
        >
          <option value="">Tüm Dönemler</option>
          {periods.map((p) => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white border rounded-lg p-8 text-center">
          <p className="text-sm text-muted-foreground">Başvuru bulunamadı.</p>
        </div>
      ) : (
        <div className="bg-white border rounded-lg divide-y">
          {applications.map((app) => (
            <div key={app.id} className="flex items-center justify-between gap-4 hover:bg-[#f6f7f9] transition-colors">
              <Link
                href={`/admin/applications/${app.id}`}
                className="flex-1 min-w-0 p-4"
              >
                <p className="font-medium text-sm truncate">{app.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {app.user.name ?? app.user.email} · {app.period.title} ·{" "}
                  {app._count.files} belge · {app._count.juryAssignments} jüri
                </p>
              </Link>

              <div className="flex items-center gap-2 shrink-0 pr-4">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[app.status]}`}>
                  {STATUS_LABELS[app.status]}
                </span>

                {app.status === "SUBMITTED" && (
                  <button
                    onClick={() => moveToReview(app.id)}
                    disabled={movingId === app.id}
                    className="text-xs px-3 py-1.5 bg-[#212121] text-white rounded-md hover:bg-[#fab758] hover:text-[#212121] disabled:opacity-50 transition-colors font-medium"
                  >
                    {movingId === app.id ? "…" : "İncelemeye Al"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

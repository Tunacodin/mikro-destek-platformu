"use client"

import { useRouter } from "next/navigation"
import { useState, useRef } from "react"
import Link from "next/link"
import type { ApplicationStatus } from "@prisma/client"
import { FileText, Users, ArrowRight } from "lucide-react"

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
  DRAFT:     "Taslak",
  SUBMITTED: "Gönderildi",
  IN_REVIEW: "İncelemede",
  EVALUATED: "Değerlendirildi",
  SUPPORTED: "Desteklendi",
  REJECTED:  "Reddedildi",
}

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  DRAFT:     "bg-slate-100 text-slate-600",
  SUBMITTED: "bg-blue-50 text-blue-700",
  IN_REVIEW: "bg-amber-50 text-amber-700",
  EVALUATED: "bg-purple-50 text-purple-700",
  SUPPORTED: "bg-emerald-50 text-emerald-700",
  REJECTED:  "bg-red-50 text-red-600",
}

const STATUS_DOT: Record<ApplicationStatus, string> = {
  DRAFT:     "bg-slate-400",
  SUBMITTED: "bg-blue-500",
  IN_REVIEW: "bg-amber-400",
  EVALUATED: "bg-purple-500",
  SUPPORTED: "bg-emerald-500",
  REJECTED:  "bg-red-500",
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
  const pendingRef = useRef(false)

  function filter(key: string, value: string | undefined) {
    const params = new URLSearchParams()
    if (key !== "status" && currentStatus) params.set("status", currentStatus)
    if (key !== "period" && currentPeriod) params.set("period", currentPeriod)
    if (value) params.set(key, value)
    router.push(`/admin/applications?${params.toString()}`)
  }

  async function moveToReview(e: React.MouseEvent, id: string) {
    e.preventDefault()
    if (pendingRef.current) return
    pendingRef.current = true
    setMovingId(id)
    try {
      await fetch(`/api/admin/applications/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IN_REVIEW" }),
      })
      router.refresh()
    } finally {
      pendingRef.current = false
      setMovingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filtreler */}
      <div className="flex flex-wrap gap-2">
        <select
          value={currentStatus ?? ""}
          onChange={(e) => filter("status", e.target.value || undefined)}
          className="px-3.5 py-2 text-[13px] font-medium border border-black/[0.08] rounded-xl bg-white text-[#1c1c1c] focus:outline-none focus:ring-2 focus:ring-[#fab758]/40 focus:border-[#fab758]/30 transition-all cursor-pointer"
        >
          <option value="">Tüm Durumlar</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>

        <select
          value={currentPeriod ?? ""}
          onChange={(e) => filter("period", e.target.value || undefined)}
          className="px-3.5 py-2 text-[13px] font-medium border border-black/[0.08] rounded-xl bg-white text-[#1c1c1c] focus:outline-none focus:ring-2 focus:ring-[#fab758]/40 focus:border-[#fab758]/30 transition-all cursor-pointer"
        >
          <option value="">Tüm Dönemler</option>
          {periods.map((p) => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white border border-black/[0.06] rounded-2xl p-10 text-center shadow-[0_1px_6px_rgba(0,0,0,0.04)]">
          <p className="text-[14px] text-[#6e6e73]">Başvuru bulunamadı.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {applications.map((app) => (
            <Link
              key={app.id}
              href={`/admin/applications/${app.id}`}
              className="group bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:border-black/[0.1] transition-all duration-200 p-4 flex flex-col gap-3 cursor-pointer"
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[app.status]}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[app.status]}`} />
                  {STATUS_LABELS[app.status]}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#d1d1d6] group-hover:text-[#aeaeb2] shrink-0 mt-0.5 transition-colors" />
              </div>

              {/* Title */}
              <div>
                <p className="text-[13px] font-semibold text-[#1c1c1c] leading-snug line-clamp-2">
                  {app.title}
                </p>
                <p className="text-[11px] text-[#aeaeb2] mt-1">
                  {app.user.name ?? app.user.email}
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-black/[0.04]">
                <span className="text-[11px] text-[#aeaeb2] truncate">{app.period.title}</span>
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="inline-flex items-center gap-1 text-[11px] text-[#aeaeb2]">
                    <FileText className="w-3 h-3" /> {app._count.files}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-[#aeaeb2]">
                    <Users className="w-3 h-3" /> {app._count.juryAssignments}
                  </span>
                </div>
              </div>

              {/* CTA for SUBMITTED */}
              {app.status === "SUBMITTED" && (
                <button
                  onClick={(e) => moveToReview(e, app.id)}
                  disabled={movingId === app.id}
                  className="w-full py-2 text-[12px] font-semibold bg-[#212121] text-white rounded-xl hover:bg-[#2d2d2d] disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {movingId === app.id ? "İşleniyor…" : "İncelemeye Al"}
                </button>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

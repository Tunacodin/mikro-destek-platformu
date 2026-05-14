"use client"

import { useRouter } from "next/navigation"
import { useState, useRef, useMemo } from "react"
import Link from "next/link"
import type { ApplicationStatus } from "@prisma/client"
import {
  FileText, Users, Search, ChevronDown, ArrowRight,
  PenLine, Send, Eye, ClipboardCheck, CheckCircle2, XCircle, Trash2,
} from "lucide-react"
import { truncate } from "@/lib/utils"

type App = {
  id: string
  title: string
  status: ApplicationStatus
  submittedAt: Date | null
  createdAt: Date
  user: { name: string | null; email: string }
  period:  { title: string } | null
  program: { title: string } | null
  _count: { files: number; juryAssignments: number }
}

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  DRAFT:     "Taslak",
  SUBMITTED: "Gönderildi",
  IN_REVIEW: "Ön İnceleme Sürecinde",
  EVALUATED: "Jüri Değerlendirme Sürecinde",
  SUPPORTED: "Desteklendi",
  REJECTED:  "Reddedildi",
}

// Liste satırlarında kullanılan kısa etiketler
const STATUS_SHORT_LABELS: Record<ApplicationStatus, string> = {
  DRAFT:     "Taslak",
  SUBMITTED: "Gönderildi",
  IN_REVIEW: "Ön İnceleme",
  EVALUATED: "Değerlendirme",
  SUPPORTED: "Desteklendi",
  REJECTED:  "Reddedildi",
}

const STATUS_ICON: Record<ApplicationStatus, React.ElementType> = {
  DRAFT:     PenLine,
  SUBMITTED: Send,
  IN_REVIEW: Eye,
  EVALUATED: ClipboardCheck,
  SUPPORTED: CheckCircle2,
  REJECTED:  XCircle,
}

const ORDER: ApplicationStatus[] = [
  "SUBMITTED", "IN_REVIEW", "EVALUATED", "SUPPORTED", "REJECTED", "DRAFT",
]

function fmtDate(d: Date | null | undefined) {
  if (!d) return ""
  return new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })
}

export function AdminApplicationList({
  applications,
  periods,
  countMap,
  total,
  currentStatus,
  currentPeriod,
}: {
  applications: App[]
  periods: { id: string; title: string }[]
  countMap: Partial<Record<ApplicationStatus, number>>
  total: number
  currentStatus?: string
  currentPeriod?: string
}) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [movingId, setMovingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<App | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const pendingRef = useRef(false)

  function setFilter(key: string, value: string | undefined) {
    const params = new URLSearchParams()
    if (key !== "status" && currentStatus) params.set("status", currentStatus)
    if (key !== "period" && currentPeriod) params.set("period", currentPeriod)
    if (value) params.set(key, value)
    router.push(`/admin/applications?${params.toString()}`)
  }

  async function confirmDelete() {
    if (!deleteTarget || pendingRef.current) return
    pendingRef.current = true
    setDeletingId(deleteTarget.id)
    setDeleteError(null)
    try {
      const res = await fetch(`/api/admin/applications/${deleteTarget.id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setDeleteError(data.error ?? `Silme başarısız (${res.status})`)
        return
      }
      setDeleteTarget(null)
      router.refresh()
    } catch {
      setDeleteError("Ağ hatası, lütfen tekrar deneyin.")
    } finally {
      pendingRef.current = false
      setDeletingId(null)
    }
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

  const filtered = useMemo(() => {
    if (!search.trim()) return applications
    const q = search.toLowerCase()
    return applications.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        (a.user.name ?? a.user.email).toLowerCase().includes(q) ||
        a.user.email.toLowerCase().includes(q)
    )
  }, [applications, search])

  return (
    <div className="space-y-4">

      {/* Silme onay popup */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.16)] border border-black/[0.06] w-full max-w-sm mx-4 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-[#1c1c1c]">Başvuruyu Sil</p>
                <p className="text-[12px] text-[#6e6e73] mt-0.5">Bu işlem geri alınamaz.</p>
              </div>
            </div>
            <div className="bg-[#f5f5f5] rounded-xl px-4 py-3">
              <p className="text-[13px] font-medium text-[#1c1c1c] line-clamp-2">{deleteTarget.title}</p>
              <p className="text-[11px] text-[#6e6e73] mt-0.5">{deleteTarget.user.name ?? deleteTarget.user.email}</p>
            </div>
            <p className="text-[12px] text-[#6e6e73] leading-relaxed">
              Bu başvuru ve ilişkili tüm veriler (değerlendirmeler, jüri atamaları, dosyalar, proje) kalıcı olarak silinecektir.
            </p>
            {deleteError && (
              <div className="px-3 py-2 bg-red-50 border border-red-100 rounded-xl">
                <p className="text-[12px] text-red-600">{deleteError}</p>
              </div>
            )}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 text-[13px] font-medium text-[#6e6e73] border border-black/[0.08] rounded-xl hover:bg-[#f5f5f5] transition-colors cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                onClick={confirmDelete}
                disabled={deletingId === deleteTarget.id}
                className="flex-1 py-2.5 text-[13px] font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {deletingId === deleteTarget.id ? "Siliniyor…" : "Evet, Sil"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status tabs */}
      <div className="flex overflow-x-auto gap-1 pb-1" style={{ scrollbarWidth: "none" }}>
        {/* Tümü */}
        <button
          onClick={() => setFilter("status", undefined)}
          className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-all cursor-pointer border ${
            !currentStatus
              ? "bg-[#1c1c1c] text-white border-[#1c1c1c]"
              : "bg-white text-[#6e6e73] border-black/[0.07] hover:border-black/[0.13] hover:text-[#1c1c1c]"
          }`}
        >
          Tümü
          <span className={`text-[11px] font-semibold tabular-nums px-1.5 py-0.5 rounded-md ${
            !currentStatus ? "bg-white/20 text-white" : "bg-black/[0.06] text-[#6e6e73]"
          }`}>
            {total}
          </span>
        </button>

        {ORDER.map((s) => {
          const count = countMap[s] ?? 0
          if (count === 0 && currentStatus !== s) return null
          const isActive = currentStatus === s
          const Icon = STATUS_ICON[s]
          return (
            <button
              key={s}
              onClick={() => setFilter("status", s)}
              className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-all cursor-pointer border ${
                isActive
                  ? "bg-white border-black/[0.1] text-[#1c1c1c] shadow-[0_1px_6px_rgba(0,0,0,0.06)]"
                  : "bg-white text-[#6e6e73] border-black/[0.07] hover:border-black/[0.13] hover:text-[#1c1c1c]"
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {STATUS_LABELS[s]}
              <span className={`text-[11px] font-semibold tabular-nums px-1.5 py-0.5 rounded-md ${
                isActive ? "bg-black/[0.05] text-[#6e6e73]" : "bg-black/[0.04] text-[#aeaeb2]"
              }`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Search + Period filter */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#aeaeb2] pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Başvuru veya başvurucu ara…"
            className="w-full pl-9 pr-3.5 py-2 text-[13px] bg-white border border-black/[0.07] rounded-xl text-[#1c1c1c] placeholder-[#aeaeb2] focus:outline-none focus:ring-2 focus:ring-[#fab758]/30 focus:border-[#fab758]/40 transition-all"
          />
        </div>

        <div className="relative">
          <select
            value={currentPeriod ?? ""}
            onChange={(e) => setFilter("period", e.target.value || undefined)}
            className="appearance-none pl-3.5 pr-8 py-2 text-[13px] font-medium bg-white border border-black/[0.07] rounded-xl text-[#1c1c1c] focus:outline-none focus:ring-2 focus:ring-[#fab758]/30 focus:border-[#fab758]/40 transition-all cursor-pointer"
          >
            <option value="">Tüm Dönemler</option>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#aeaeb2] pointer-events-none" />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-black/[0.06] rounded-2xl py-16 text-center shadow-[0_1px_6px_rgba(0,0,0,0.04)]">
          <div className="w-10 h-10 rounded-2xl bg-[#f5f5f5] flex items-center justify-center mx-auto mb-3">
            <FileText className="w-5 h-5 text-[#d1d1d6]" />
          </div>
          <p className="text-[14px] font-medium text-[#1c1c1c]">
            {search ? "Arama sonucu bulunamadı" : "Başvuru bulunamadı"}
          </p>
          <p className="text-[12px] text-[#aeaeb2] mt-1">
            {search ? "Farklı bir arama terimi deneyin" : "Seçili filtreye ait başvuru yok"}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-black/[0.06] rounded-2xl shadow-[0_1px_6px_rgba(0,0,0,0.04)] overflow-hidden">
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[1fr_140px_80px_80px_36px] gap-4 px-5 py-2.5 border-b border-black/[0.04]">
            <p className="text-[11px] font-semibold text-[#aeaeb2] uppercase tracking-wider">Başvuru</p>
            <p className="text-[11px] font-semibold text-[#aeaeb2] uppercase tracking-wider">Dönem</p>
            <p className="text-[11px] font-semibold text-[#aeaeb2] uppercase tracking-wider text-center">Durum</p>
            <p className="text-[11px] font-semibold text-[#aeaeb2] uppercase tracking-wider text-right">Tarih</p>
            <div />
          </div>

          <div className="divide-y divide-black/[0.04]">
            {filtered.map((app) => (
              <Link
                key={app.id}
                href={`/admin/applications/${app.id}`}
                className="group flex sm:grid sm:grid-cols-[1fr_140px_80px_80px_36px] gap-4 items-center px-5 py-4 hover:bg-[#fafafa] transition-colors cursor-pointer"
              >
                {/* Başvuru */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  {(() => { const Icon = STATUS_ICON[app.status]; return <Icon className="mt-0.5 w-3.5 h-3.5 shrink-0 text-[#aeaeb2]" /> })()}
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-[#1c1c1c] leading-snug truncate group-hover:text-[#000]" title={app.title}>
                      {truncate(app.title, 30)}
                    </p>
                    <div className="flex items-center gap-2.5 mt-1 flex-wrap">
                      <p className="text-[11px] text-[#6e6e73]">
                        {app.user.name ?? app.user.email}
                      </p>
                      <span className="text-[#d1d1d6]">·</span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#aeaeb2]">
                        <FileText className="w-3 h-3" /> {app._count.files}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#aeaeb2]">
                        <Users className="w-3 h-3" /> {app._count.juryAssignments}
                      </span>
                      {/* Mobile: show status inline */}
                      <span className="sm:hidden text-[#d1d1d6]">·</span>
                      <span className="sm:hidden inline-flex items-center gap-1 text-[11px] text-[#6e6e73]">
                        {(() => { const Icon = STATUS_ICON[app.status]; return <Icon className="w-3 h-3" /> })()}
                        {STATUS_SHORT_LABELS[app.status]}
                      </span>
                    </div>
                    {/* Mobile CTA */}
                    <div className="sm:hidden flex items-center gap-2 mt-2">
                      {app.status === "SUBMITTED" && (
                        <button
                          onClick={(e) => moveToReview(e, app.id)}
                          disabled={movingId === app.id}
                          className="px-3 py-1.5 text-[11px] font-semibold bg-[#212121] text-white rounded-lg hover:bg-[#383838] disabled:opacity-50 transition-colors cursor-pointer"
                        >
                          {movingId === app.id ? "…" : "İncelemeye Al"}
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteTarget(app); setDeleteError(null) }}
                        className="px-3 py-1.5 text-[11px] font-semibold text-red-500 border border-red-200 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                </div>

                {/* Dönem / Program — desktop */}
                <p className="hidden sm:block text-[12px] text-[#6e6e73] truncate">{app.period?.title ?? app.program?.title ?? "—"}</p>

                {/* Durum — desktop */}
                <div className="hidden sm:flex items-center justify-center">
                  {app.status === "SUBMITTED" ? (
                    <button
                      onClick={(e) => moveToReview(e, app.id)}
                      disabled={movingId === app.id}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-[#212121] text-white rounded-lg hover:bg-[#383838] disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {movingId === app.id ? "…" : "İncelemeye Al"}
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[12px] text-[#6e6e73] whitespace-nowrap">
                      {(() => { const Icon = STATUS_ICON[app.status]; return <Icon className="w-3.5 h-3.5 shrink-0" /> })()}
                      {STATUS_SHORT_LABELS[app.status]}
                    </span>
                  )}
                </div>

                {/* Tarih — desktop */}
                <div className="hidden sm:flex items-center justify-end">
                  <p className="text-[12px] text-[#aeaeb2] tabular-nums">
                    {fmtDate(app.submittedAt ?? app.createdAt)}
                  </p>
                </div>

                {/* Sil — desktop */}
                <div className="hidden sm:flex items-center justify-center">
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteTarget(app); setDeleteError(null) }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[#d1d1d6] hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                    title="Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Link>
            ))}
          </div>

          {/* Footer count */}
          {filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-black/[0.04] bg-[#fafafa]">
              <p className="text-[11px] text-[#aeaeb2]">
                {filtered.length} başvuru{search ? ` "${search}" için` : ""}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

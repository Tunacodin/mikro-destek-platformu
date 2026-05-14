"use client"

import { useRouter } from "next/navigation"
import { useState, useMemo } from "react"
import Link from "next/link"
import {
  FolderOpen, ArrowRight, FileText, Send, Search,
  Layers, Zap, Star, CheckCircle2, Clock, Archive,
} from "lucide-react"
import { truncate } from "@/lib/utils"

type Project = {
  id: string
  status: string
  supportEndDate: Date | null
  createdAt: Date
  application: {
    title: string
    user: { name: string | null; email: string }
    period:  { title: string } | null
    program: { title: string } | null
  }
  decision: { scope: string; decidedAt: Date }
  reports: { id: string }[]
  files: { id: string }[]
}

const SCOPE_LABELS: Record<string, string> = {
  LIMITED:  "Sınırlı Destek",
  EXTENDED: "Genişletilmiş Destek",
  PRIORITY: "Öncelikli Destek",
}

const SCOPE_ICON: Record<string, React.ElementType> = {
  LIMITED:  Layers,
  EXTENDED: Zap,
  PRIORITY: Star,
}

const STATUS_ICON: Record<string, React.ElementType> = {
  ACTIVE:   CheckCircle2,
  ARCHIVED: Archive,
  CLOSED:   Archive,
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE:   "Aktif",
  ARCHIVED: "Arşivlendi",
  CLOSED:   "Kapandı",
}

const SCOPE_ORDER = ["LIMITED", "EXTENDED", "PRIORITY"] as const

function fmtShort(d: Date) {
  return new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })
}

export function AdminProjectList({
  projects,
  scopeCounts,
  total,
  currentScope,
}: {
  projects: Project[]
  scopeCounts: Record<string, number>
  total: number
  currentScope?: string
}) {
  const router = useRouter()
  const [search, setSearch] = useState("")

  function setFilter(scope: string | undefined) {
    const params = new URLSearchParams()
    if (scope) params.set("scope", scope)
    router.push(`/admin/projects?${params.toString()}`)
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return projects
    const q = search.toLowerCase()
    return projects.filter(
      (p) =>
        p.application.title.toLowerCase().includes(q) ||
        (p.application.user.name ?? p.application.user.email).toLowerCase().includes(q)
    )
  }, [projects, search])

  return (
    <div className="space-y-4">

      {/* Scope tabs + Search */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex overflow-x-auto gap-1" style={{ scrollbarWidth: "none" }}>
          <button
            onClick={() => setFilter(undefined)}
            className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-all cursor-pointer border ${
              !currentScope
                ? "bg-[#1c1c1c] text-white border-[#1c1c1c]"
                : "bg-white text-[#6e6e73] border-black/[0.07] hover:border-black/[0.13] hover:text-[#1c1c1c]"
            }`}
          >
            Tümü
            <span className={`text-[11px] font-semibold tabular-nums px-1.5 py-0.5 rounded-md ${
              !currentScope ? "bg-white/20 text-white" : "bg-black/[0.06] text-[#6e6e73]"
            }`}>
              {total}
            </span>
          </button>

          {SCOPE_ORDER.map((s) => {
            const count = scopeCounts[s] ?? 0
            if (count === 0 && currentScope !== s) return null
            const isActive = currentScope === s
            const Icon = SCOPE_ICON[s]
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-all cursor-pointer border ${
                  isActive
                    ? "bg-white border-black/[0.1] text-[#1c1c1c] shadow-[0_1px_6px_rgba(0,0,0,0.06)]"
                    : "bg-white text-[#6e6e73] border-black/[0.07] hover:border-black/[0.13] hover:text-[#1c1c1c]"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {SCOPE_LABELS[s]}
                <span className={`text-[11px] font-semibold tabular-nums px-1.5 py-0.5 rounded-md ${
                  isActive ? "bg-black/[0.05] text-[#6e6e73]" : "bg-black/[0.04] text-[#aeaeb2]"
                }`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        <div className="relative ml-auto w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#aeaeb2] pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Proje ara…"
            className="w-full pl-9 pr-3.5 py-2 text-[13px] bg-white border border-black/[0.07] rounded-xl text-[#1c1c1c] placeholder-[#aeaeb2] focus:outline-none focus:ring-2 focus:ring-[#fab758]/30 focus:border-[#fab758]/40 transition-all"
          />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-black/[0.06] rounded-2xl py-16 text-center shadow-[0_1px_6px_rgba(0,0,0,0.04)]">
          <div className="w-10 h-10 rounded-2xl bg-[#f5f5f5] flex items-center justify-center mx-auto mb-3">
            <FolderOpen className="w-5 h-5 text-[#d1d1d6]" />
          </div>
          <p className="text-[14px] font-medium text-[#1c1c1c]">
            {search ? "Arama sonucu bulunamadı" : "Proje bulunamadı"}
          </p>
          <p className="text-[12px] text-[#aeaeb2] mt-1">
            {search ? "Farklı bir arama terimi deneyin" : "Seçili filtreye ait proje yok"}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-black/[0.06] rounded-2xl shadow-[0_1px_6px_rgba(0,0,0,0.04)] overflow-hidden">
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[1fr_140px_100px_80px] gap-4 px-5 py-2.5 border-b border-black/[0.04]">
            <p className="text-[11px] font-semibold text-[#aeaeb2] uppercase tracking-wider">Proje</p>
            <p className="text-[11px] font-semibold text-[#aeaeb2] uppercase tracking-wider">Destek Kapsamı</p>
            <p className="text-[11px] font-semibold text-[#aeaeb2] uppercase tracking-wider text-center">Durum</p>
            <p className="text-[11px] font-semibold text-[#aeaeb2] uppercase tracking-wider text-right">Bitiş</p>
          </div>

          <div className="divide-y divide-black/[0.04]">
            {filtered.map((p) => {
              const ScopeIcon  = SCOPE_ICON[p.decision.scope] ?? Layers
              const StatusIcon = STATUS_ICON[p.status] ?? CheckCircle2
              const scopeLabel = SCOPE_LABELS[p.decision.scope] ?? p.decision.scope
              const statusLabel = STATUS_LABELS[p.status] ?? p.status
              const isActive = p.status === "ACTIVE"
              const endingSoon = isActive && p.supportEndDate
                && (p.supportEndDate.getTime() - Date.now()) < 7 * 24 * 3_600_000

              return (
                <Link
                  key={p.id}
                  href={`/admin/projects/${p.id}`}
                  className="group flex sm:grid sm:grid-cols-[1fr_140px_100px_80px] gap-4 items-center px-5 py-4 hover:bg-[#fafafa] transition-colors cursor-pointer"
                >
                  {/* Proje */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {(() => { const Icon = SCOPE_ICON[p.decision.scope] ?? Layers; return <Icon className="mt-0.5 w-3.5 h-3.5 shrink-0 text-[#aeaeb2]" /> })()}
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-[#1c1c1c] truncate leading-snug group-hover:text-[#000]" title={p.application.title}>
                        {truncate(p.application.title, 30)}
                      </p>
                      <div className="flex items-center gap-2.5 mt-1 flex-wrap">
                        <p className="text-[11px] text-[#6e6e73]">
                          {p.application.user.name ?? p.application.user.email}
                        </p>
                        <span className="text-[#d1d1d6]">·</span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#aeaeb2]">
                          <Send className="w-3 h-3" /> {p.reports.length}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#aeaeb2]">
                          <FileText className="w-3 h-3" /> {p.files.length}
                        </span>
                        {/* Mobile: scope + status */}
                        <span className="sm:hidden text-[#d1d1d6]">·</span>
                        <span className="sm:hidden inline-flex items-center gap-1 text-[11px] text-[#6e6e73]">
                          <ScopeIcon className="w-3 h-3" /> {scopeLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Destek Kapsamı — desktop */}
                  <div className="hidden sm:flex items-center gap-1.5">
                    <ScopeIcon className="w-3.5 h-3.5 text-[#6e6e73] shrink-0" />
                    <span className="text-[12px] text-[#6e6e73] truncate">{scopeLabel}</span>
                  </div>

                  {/* Durum — desktop */}
                  <div className="hidden sm:flex items-center justify-center gap-1.5">
                    <StatusIcon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-emerald-500" : "text-[#aeaeb2]"}`} />
                    <span className={`text-[12px] ${isActive ? "text-emerald-700 font-medium" : "text-[#aeaeb2]"}`}>
                      {statusLabel}
                    </span>
                    {endingSoon && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-600 ml-0.5">
                        <Clock className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  {/* Bitiş — desktop */}
                  <div className="hidden sm:flex items-center justify-end gap-2">
                    <p className="text-[12px] text-[#aeaeb2] tabular-nums">
                      {p.supportEndDate ? fmtShort(p.supportEndDate) : "—"}
                    </p>
                    <ArrowRight className="w-3.5 h-3.5 text-[#d1d1d6] group-hover:text-[#aeaeb2] transition-colors shrink-0" />
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Footer */}
          {filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-black/[0.04] bg-[#fafafa]">
              <p className="text-[11px] text-[#aeaeb2]">
                {filtered.length} proje{search ? ` "${search}" için` : ""}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { UserPlus, X } from "lucide-react"
import type { ApplicationStatus } from "@prisma/client"

type JuryUser = { id: string; name: string | null; email: string }

export function JuryAssignPanel({
  applicationId,
  applicationStatus,
  assignedJuries,
  allJuries,
}: {
  applicationId: string
  applicationStatus: ApplicationStatus
  assignedJuries: JuryUser[]
  allJuries: JuryUser[]
}) {
  const router = useRouter()
  const [selectedJuryId, setSelectedJuryId] = useState("")
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pendingRef = useRef(false)

  const assignedIds = new Set(assignedJuries.map((j) => j.id))
  const available = allJuries.filter((j) => !assignedIds.has(j.id))
  const canEdit = applicationStatus === "IN_REVIEW"

  async function assign() {
    if (!selectedJuryId || pendingRef.current) return
    pendingRef.current = true
    setLoading("assign"); setError(null)
    try {
      const res = await fetch("/api/admin/jury/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, juryId: selectedJuryId }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Bir hata oluştu.")
      } else {
        setSelectedJuryId("")
        router.refresh()
      }
    } finally {
      pendingRef.current = false
      setLoading(null)
    }
  }

  async function unassign(juryId: string) {
    if (pendingRef.current) return
    pendingRef.current = true
    setLoading(juryId); setError(null)
    try {
      const res = await fetch("/api/admin/jury/assign", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, juryId }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Bir hata oluştu.")
      } else {
        router.refresh()
      }
    } finally {
      pendingRef.current = false
      setLoading(null)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] p-5 space-y-4">
      <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-[0.12em]">Jüri Ataması</p>

      {!canEdit && (
        <div className="bg-[#f5f5f5] rounded-xl px-3.5 py-2.5">
          <p className="text-[12px] text-[#6e6e73]">
            Jüri ataması yalnızca <strong className="text-[#1c1c1c]">İncelemede</strong> durumundaki başvurularda yapılabilir.
          </p>
        </div>
      )}

      {/* Atanmış Jüriler */}
      {assignedJuries.length === 0 ? (
        <p className="text-[13px] text-[#aeaeb2]">Henüz jüri atanmadı.</p>
      ) : (
        <ul className="space-y-2">
          {assignedJuries.map((j) => (
            <li key={j.id} className="flex items-center justify-between gap-2 px-3 py-2.5 bg-[#f5f5f5] rounded-xl">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-[#1c1c1c] truncate">{j.name ?? j.email}</p>
                {j.name && (
                  <p className="text-[11px] text-[#6e6e73] truncate">{j.email}</p>
                )}
              </div>
              {canEdit && (
                <button
                  onClick={() => unassign(j.id)}
                  disabled={loading === j.id}
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-[#aeaeb2] hover:bg-red-100 hover:text-red-500 disabled:opacity-40 transition-colors cursor-pointer shrink-0"
                >
                  {loading === j.id ? <span className="text-[11px]">…</span> : <X className="w-3.5 h-3.5" />}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Yeni Jüri Ekle */}
      {canEdit && available.length > 0 && (
        <div className="pt-3 border-t border-black/[0.05] space-y-2">
          <p className="text-[11px] font-semibold text-[#aeaeb2] uppercase tracking-[0.08em]">Jüri Ekle</p>
          <div className="flex gap-2">
            <select
              value={selectedJuryId}
              onChange={(e) => setSelectedJuryId(e.target.value)}
              className="flex-1 px-3 py-2 bg-[#f5f5f5] border border-transparent rounded-xl text-[13px] text-[#1c1c1c] focus:outline-none focus:ring-2 focus:ring-[#fab758]/50 focus:bg-white focus:border-[#fab758]/30 transition-all cursor-pointer"
            >
              <option value="">— Seçin —</option>
              {available.map((j) => (
                <option key={j.id} value={j.id}>{j.name ?? j.email}</option>
              ))}
            </select>
            <button
              onClick={assign}
              disabled={!selectedJuryId || loading === "assign"}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#212121] text-white text-[12px] font-semibold rounded-xl shadow-sm hover:bg-[#383838] hover:shadow disabled:opacity-40 transition-colors cursor-pointer shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              {loading === "assign" ? "…" : "Ata"}
            </button>
          </div>
        </div>
      )}

      {canEdit && available.length === 0 && assignedJuries.length > 0 && (
        <p className="text-[12px] text-[#aeaeb2] pt-2 border-t border-black/[0.05]">
          Tüm jüri üyeleri atandı.
        </p>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
          <p className="text-[12px] text-red-600">{error}</p>
        </div>
      )}
    </div>
  )
}

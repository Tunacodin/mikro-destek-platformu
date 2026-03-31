"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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

  const assignedIds = new Set(assignedJuries.map((j) => j.id))
  const available = allJuries.filter((j) => !assignedIds.has(j.id))
  const canEdit = applicationStatus === "IN_REVIEW"

  async function assign() {
    if (!selectedJuryId) return
    setLoading("assign")
    setError(null)
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
    setLoading(null)
  }

  async function unassign(juryId: string) {
    setLoading(juryId)
    setError(null)
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
    setLoading(null)
  }

  return (
    <div className="bg-white border rounded-lg p-5 space-y-4">
      <h2 className="font-semibold text-sm">Jüri Ataması</h2>

      {!canEdit && (
        <p className="text-xs text-muted-foreground bg-slate-50 border rounded p-2">
          Jüri ataması yalnızca <strong>İncelemede</strong> durumundaki başvurularda yapılabilir.
        </p>
      )}

      {/* Atanmış Jüriler */}
      {assignedJuries.length === 0 ? (
        <p className="text-sm text-muted-foreground">Henüz jüri atanmadı.</p>
      ) : (
        <ul className="space-y-2">
          {assignedJuries.map((j) => (
            <li key={j.id} className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{j.name ?? j.email}</p>
                {j.name && (
                  <p className="text-xs text-muted-foreground truncate">{j.email}</p>
                )}
              </div>
              {canEdit && (
                <button
                  onClick={() => unassign(j.id)}
                  disabled={loading === j.id}
                  className="text-xs text-red-600 hover:text-red-800 disabled:opacity-40 shrink-0"
                >
                  {loading === j.id ? "…" : "Kaldır"}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Yeni Jüri Ekle */}
      {canEdit && available.length > 0 && (
        <div className="pt-3 border-t space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Jüri Ekle</p>
          <div className="flex gap-2">
            <select
              value={selectedJuryId}
              onChange={(e) => setSelectedJuryId(e.target.value)}
              className="flex-1 text-sm border rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
            >
              <option value="">— Seçin —</option>
              {available.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.name ?? j.email}
                </option>
              ))}
            </select>
            <button
              onClick={assign}
              disabled={!selectedJuryId || loading === "assign"}
              className="text-sm px-3 py-1.5 bg-slate-900 text-white rounded-md hover:bg-slate-700 disabled:opacity-50 transition-colors shrink-0"
            >
              {loading === "assign" ? "…" : "Ata"}
            </button>
          </div>
        </div>
      )}

      {canEdit && available.length === 0 && assignedJuries.length > 0 && (
        <p className="text-xs text-muted-foreground pt-2 border-t">
          Tüm jüri üyeleri atandı.
        </p>
      )}

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</p>
      )}
    </div>
  )
}

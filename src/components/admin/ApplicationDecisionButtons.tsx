"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { ApplicationStatus } from "@prisma/client"

export function ApplicationDecisionButtons({
  applicationId,
  status,
}: {
  applicationId: string
  status: ApplicationStatus
}) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  if (status !== "EVALUATED") return null

  async function decide(newStatus: "SUPPORTED" | "REJECTED") {
    setLoading(newStatus)
    await fetch(`/api/admin/applications/${applicationId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
    setLoading(null)
    router.refresh()
  }

  return (
    <div className="bg-white border border-purple-200 rounded-lg p-5 space-y-3">
      <h2 className="font-semibold text-sm">Destek Kararı</h2>
      <p className="text-xs text-muted-foreground">
        Değerlendirme tamamlandı. Başvuruyu destekleyebilir veya reddedebilirsiniz.
      </p>
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => decide("SUPPORTED")}
          disabled={!!loading}
          className="flex-1 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {loading === "SUPPORTED" ? "…" : "Destekle"}
        </button>
        <button
          onClick={() => decide("REJECTED")}
          disabled={!!loading}
          className="flex-1 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {loading === "REJECTED" ? "…" : "Reddet"}
        </button>
      </div>
    </div>
  )
}

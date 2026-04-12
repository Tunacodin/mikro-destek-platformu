"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Lock, Unlock } from "lucide-react"

export function LockEvaluationsButton({
  applicationId,
  locked,
}: {
  applicationId: string
  locked: boolean
}) {
  const router = useRouter()
  const [isLocked, setIsLocked] = useState(locked)
  const [loading, setLoading] = useState(false)
  const pendingRef = useRef(false)

  async function toggle() {
    if (pendingRef.current) return
    pendingRef.current = true
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/applications/${applicationId}/lock-evaluations`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locked: !isLocked }),
      })
      if (res.ok) {
        setIsLocked((v) => !v)
        router.refresh()
      }
    } finally {
      pendingRef.current = false
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] px-4 py-3.5 space-y-3">
      <div className="flex items-center gap-2">
        {isLocked
          ? <Lock className="w-3.5 h-3.5 text-red-500" />
          : <Unlock className="w-3.5 h-3.5 text-emerald-500" />
        }
        <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-wider">
          Jüri Değerlendirme Yetkisi
        </p>
      </div>

      <div className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1.5 ${
        isLocked
          ? "bg-red-50 text-red-600"
          : "bg-emerald-50 text-emerald-700"
      }`}>
        {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
        {isLocked ? "Kilitli — Düzenleme Kapalı" : "Açık — Düzenleme Serbest"}
      </div>

      <button
        onClick={toggle}
        disabled={loading}
        className={`w-full py-2 text-[12px] font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
          isLocked
            ? "bg-emerald-600 text-white hover:bg-emerald-700"
            : "bg-red-600 text-white hover:bg-red-700"
        }`}
      >
        {loading
          ? "İşleniyor…"
          : isLocked
            ? "Düzenlemeyi Aç"
            : "Düzenlemeyi Kapat"
        }
      </button>
    </div>
  )
}

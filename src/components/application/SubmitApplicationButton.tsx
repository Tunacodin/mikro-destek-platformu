"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Send } from "lucide-react"

export function SubmitApplicationButton({ applicationId }: { applicationId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    setLoading(true); setError(null)
    const res = await fetch(`/api/applications/${applicationId}/submit`, { method: "POST" })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? "Bir hata oluştu."); setLoading(false) }
    else router.push("/dashboard/applications?submitted=1")
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="bg-red-50 rounded-xl px-4 py-2.5">
          <p className="text-[13px] text-red-600">{error}</p>
        </div>
      )}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#212121] text-white text-[13px] font-semibold rounded-xl hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
      >
        <Send className="w-3.5 h-3.5" />
        {loading ? "Gönderiliyor…" : "Başvuruyu Gönder"}
      </button>
    </div>
  )
}

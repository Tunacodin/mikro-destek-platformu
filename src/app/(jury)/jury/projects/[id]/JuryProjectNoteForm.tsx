"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Send } from "lucide-react"

export function JuryProjectNoteForm({ applicationId }: { applicationId: string }) {
  const router = useRouter()
  const pendingRef = useRef(false)
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  async function handleSubmit() {
    setError("")
    if (content.trim().length < 10) {
      setError("Not en az 10 karakter olmalıdır.")
      return
    }
    if (pendingRef.current) return
    pendingRef.current = true
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${applicationId}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Bir hata oluştu."); return }
      setSuccess(true)
      setContent("")
      router.refresh()
    } catch {
      setError("Beklenmedik bir hata oluştu.")
    } finally {
      pendingRef.current = false
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex items-center gap-2.5 px-4 py-3.5 bg-emerald-50 rounded-xl border border-emerald-100">
        <span className="text-emerald-500">✓</span>
        <div>
          <p className="text-[13px] font-semibold text-emerald-700">Geri bildirim gönderildi!</p>
          <button
            onClick={() => setSuccess(false)}
            className="text-[11px] text-emerald-600 hover:underline cursor-pointer"
          >
            Yeni geri bildirim gönder
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[12px] font-medium text-[#6e6e73]">Görüş ve Öneri</label>
          <span className={`text-[11px] font-semibold tabular-nums transition-colors ${content.length >= 10 ? "text-emerald-500" : "text-[#aeaeb2]"}`}>
            {content.length} / 10+
          </span>
        </div>
        <textarea
          value={content}
          onChange={(e) => { setContent(e.target.value); setError("") }}
          placeholder="Proje hakkında yöneticiye iletmek istediğiniz gözlem veya notlar…"
          rows={4}
          className="w-full px-3.5 py-3 bg-white border border-black/[0.08] rounded-xl text-[13px] text-[#1c1c1c] placeholder:text-[#c7c7cc] resize-none focus:outline-none focus:ring-2 focus:ring-[#fab758]/40 focus:border-[#fab758]/40 transition-all leading-relaxed"
        />
      </div>

      {error && (
        <div className="px-3.5 py-2.5 bg-red-50 border border-red-100 rounded-xl">
          <p className="text-[12px] text-red-600">{error}</p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || content.trim().length < 10}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#212121] text-white text-[13px] font-semibold rounded-xl shadow-sm hover:bg-[#383838] hover:shadow disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        <Send className="w-3.5 h-3.5" />
        {loading ? "Gönderiliyor…" : "Gönder"}
      </button>
    </div>
  )
}

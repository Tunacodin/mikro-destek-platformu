"use client"

import { useEffect, useState } from "react"
import { MessageSquare, X } from "lucide-react"

type FileNote = { id: string; note: string; createdAt: string }

export function FileNotePanel({ fileId, canEvaluate }: { fileId: string; canEvaluate: boolean }) {
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState<FileNote[]>([])
  const [noteText, setNoteText] = useState("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch(`/api/jury/file-notes?fileId=${fileId}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setNotes(data) })
      .finally(() => setLoading(false))
  }, [open, fileId])

  async function handleSave() {
    if (!noteText.trim()) return
    setSaving(true); setError(null)
    const res = await fetch("/api/jury/file-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileId, note: noteText.trim() }),
    })
    const data = await res.json()
    if (!res.ok) setError(data.error ?? "Bir hata oluştu.")
    else { setNotes((prev) => [...prev, data]); setNoteText("") }
    setSaving(false)
  }

  const fmt = (s: string) =>
    new Date(s).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-[11px] font-medium text-[#aeaeb2] hover:text-[#6e6e73] transition-colors"
      >
        <MessageSquare className="w-3 h-3" />
        {open ? "Notları Kapat" : `Not${notes.length > 0 ? ` (${notes.length})` : " Ekle"}`}
      </button>

      {open && (
        <div className="mt-2 bg-[#f5f5f5] rounded-xl p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wide">Değerlendirici Notları</p>
            <button onClick={() => setOpen(false)} className="text-[#aeaeb2] hover:text-[#6e6e73] transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading && <p className="text-[12px] text-[#aeaeb2]">Yükleniyor…</p>}

          {!loading && notes.length === 0 && (
            <p className="text-[12px] text-[#aeaeb2]">Henüz not eklenmemiş.</p>
          )}

          {notes.length > 0 && (
            <ul className="space-y-1.5">
              {notes.map((n) => (
                <li key={n.id} className="bg-white rounded-lg px-3 py-2 space-y-0.5">
                  <p className="text-[12px] text-[#1c1c1c] whitespace-pre-wrap">{n.note}</p>
                  <p className="text-[10px] text-[#aeaeb2]">{fmt(n.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}

          {canEvaluate && (
            <div className="space-y-1.5">
              <textarea
                value={noteText}
                onChange={(e) => { setNoteText(e.target.value); setError(null) }}
                placeholder="Bu dosya hakkında not ekle…"
                rows={2}
                className="w-full px-3 py-2 bg-white border-0 rounded-lg text-[12px] text-[#1c1c1c] placeholder:text-[#aeaeb2] resize-none focus:outline-none focus:ring-1 focus:ring-[#fab758]/40 transition-all"
              />
              {error && <p className="text-[11px] text-red-500">{error}</p>}
              <button
                onClick={handleSave}
                disabled={saving || !noteText.trim()}
                className="text-[12px] font-semibold px-3 py-1.5 bg-[#212121] text-white rounded-lg hover:bg-[#2d2d2d] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {saving ? "Kaydediliyor…" : "Kaydet"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

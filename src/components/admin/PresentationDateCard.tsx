"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Calendar, Pencil, Check, X, Trash2 } from "lucide-react"
import type { ApplicationStatus } from "@prisma/client"

const inputCls = "w-full px-3 py-2 bg-[#f5f5f5] border border-transparent rounded-xl text-[13px] text-[#1c1c1c] focus:outline-none focus:ring-2 focus:ring-[#fab758]/50 focus:bg-white focus:border-[#fab758]/30 transition-all"

// Date → "YYYY-MM-DDTHH:mm" (datetime-local input formatı, lokal zaman)
function toLocalInputValue(date: Date | null): string {
  if (!date) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function PresentationDateCard({
  applicationId,
  status,
  presentationDate,
}: {
  applicationId: string
  status: ApplicationStatus
  presentationDate: Date | string | null
}) {
  const router = useRouter()
  const initialDate = presentationDate ? new Date(presentationDate) : null
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(toLocalInputValue(initialDate))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const editable = status === "SUBMITTED" || status === "IN_REVIEW"

  async function save(newValue: string | null) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/applications/${applicationId}/presentation-date`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          presentationDate: newValue ? new Date(newValue).toISOString() : null,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Güncelleme başarısız.")
      }
      setEditing(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.")
    } finally {
      setLoading(false)
    }
  }

  // Tarih yoksa ve düzenlenemez ise hiç gösterme
  if (!initialDate && !editable) return null

  return (
    <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] px-4 py-3.5">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-[#fab758]" />
          <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-wider">Jüri Sunum Tarihi</p>
        </div>
        {editable && !editing && (
          <button
            onClick={() => {
              setValue(toLocalInputValue(initialDate))
              setEditing(true)
              setError(null)
            }}
            className="text-[11px] text-[#6e6e73] hover:text-[#1c1c1c] flex items-center gap-1 cursor-pointer"
          >
            <Pencil className="w-3 h-3" />
            {initialDate ? "Düzenle" : "Ekle"}
          </button>
        )}
      </div>

      {!editing && initialDate && (
        <p className="text-[13px] font-semibold text-[#1c1c1c]">
          {initialDate.toLocaleString("tr-TR", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Europe/Istanbul",
          })}
        </p>
      )}

      {!editing && !initialDate && editable && (
        <p className="text-[12px] text-[#aeaeb2]">Henüz belirlenmedi.</p>
      )}

      {editing && (
        <div className="space-y-2 mt-1">
          <input
            type="datetime-local"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={loading}
            className={inputCls}
          />
          {error && <p className="text-[11px] text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditing(false)
                setError(null)
              }}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[12px] text-[#6e6e73] rounded-lg hover:bg-[#f5f5f5] disabled:opacity-40 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              İptal
            </button>
            <button
              onClick={() => save(value || null)}
              disabled={loading || !value}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#212121] text-white text-[12px] font-semibold rounded-lg hover:bg-[#383838] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              {loading ? "Kaydediliyor…" : "Kaydet"}
            </button>
          </div>
          {initialDate && (
            <button
              onClick={() => save(null)}
              disabled={loading}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              Tarihi Kaldır
            </button>
          )}
        </div>
      )}
    </div>
  )
}

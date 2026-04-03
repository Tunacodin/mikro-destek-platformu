"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function ApplicationEditForm({
  applicationId, initialTitle, initialDescription, locked,
}: {
  applicationId: string
  initialTitle: string
  initialDescription: string
  locked: boolean
}) {
  const router = useRouter()
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true); setError(null); setSaved(false)
    const res = await fetch(`/api/applications/${applicationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), description: description.trim() }),
    })
    const data = await res.json()
    if (!res.ok) setError(data.error ?? "Bir hata oluştu.")
    else { setSaved(true); router.refresh() }
    setSaving(false)
  }

  const hasChanges = title.trim() !== initialTitle || description.trim() !== initialDescription
  const isValid = title.trim().length >= 3 && description.trim().length >= 50

  if (locked) {
    return (
      <div className="bg-red-50 rounded-xl px-4 py-3">
        <p className="text-[13px] font-semibold text-red-600">Düzenleme yetkisi kapalı</p>
        <p className="text-[12px] text-red-500 mt-0.5">
          Dönem bitimine 48 saatten az kaldığı için başvuru bilgileri düzenlenemiyor.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3.5">
      <div>
        <label className="block text-[12px] font-medium text-[#6e6e73] mb-1.5">Proje Başlığı</label>
        <input
          type="text"
          value={title}
          onChange={(e) => { setTitle(e.target.value); setSaved(false) }}
          className="w-full px-3.5 py-2.5 bg-[#f5f5f5] border-0 rounded-xl text-[14px] text-[#1c1c1c] focus:outline-none focus:ring-2 focus:ring-[#fab758]/40 focus:bg-white transition-all"
        />
      </div>

      <div>
        <label className="block text-[12px] font-medium text-[#6e6e73] mb-1.5">
          Proje Açıklaması
          <span className="text-[#aeaeb2] font-normal ml-1">({description.length} / min. 50)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => { setDescription(e.target.value); setSaved(false) }}
          rows={6}
          className="w-full px-3.5 py-2.5 bg-[#f5f5f5] border-0 rounded-xl text-[14px] text-[#1c1c1c] resize-none focus:outline-none focus:ring-2 focus:ring-[#fab758]/40 focus:bg-white transition-all"
        />
      </div>

      {error && (
        <div className="bg-red-50 rounded-xl px-4 py-2.5">
          <p className="text-[13px] text-red-600">{error}</p>
        </div>
      )}
      {saved && (
        <div className="bg-emerald-50 rounded-xl px-4 py-2.5">
          <p className="text-[13px] text-emerald-700">Değişiklikler kaydedildi.</p>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving || !hasChanges || !isValid}
        className="px-4 py-2.5 bg-[#212121] text-white text-[13px] font-semibold rounded-xl hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
      >
        {saving ? "Kaydediliyor…" : "Kaydet"}
      </button>
    </div>
  )
}

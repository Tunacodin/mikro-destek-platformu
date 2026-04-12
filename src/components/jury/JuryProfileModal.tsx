"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X, Check } from "lucide-react"

const EXPERTISE_OPTIONS = [
  "Teknoloji/Girişimcilik",
  "Sanat/Kültürel/İçerik",
  "Araştırma/Akademik",
  "İnovasyon Yönetimi",
  "Sürdürülebilirlik",
  "Sosyal Etki",
]

const inputCls = "w-full px-3.5 py-2.5 bg-[#f5f5f5] border border-transparent rounded-xl text-[14px] text-[#1c1c1c] placeholder:text-[#c7c7cc] focus:outline-none focus:ring-2 focus:ring-[#fab758]/50 focus:bg-white focus:border-[#fab758]/30 transition-all"

export function JuryProfileModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [juryTitle, setJuryTitle] = useState("")
  const [juryOrganization, setJuryOrganization] = useState("")
  const [juryExpertise, setJuryExpertise] = useState<string[]>([])
  const [juryBio, setJuryBio] = useState("")

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    setError("")
    setSuccess(false)
    fetch("/api/jury/profile")
      .then((r) => r.json())
      .then((data) => {
        setName(data.name ?? "")
        setEmail(data.email ?? "")
        setJuryTitle(data.juryTitle ?? "")
        setJuryOrganization(data.juryOrganization ?? "")
        setJuryExpertise(data.juryExpertise ?? [])
        setJuryBio(data.juryBio ?? "")
      })
      .catch(() => setError("Profil yüklenemedi."))
      .finally(() => setLoading(false))
  }, [isOpen])

  function toggleExpertise(area: string) {
    setJuryExpertise((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    )
    setSuccess(false)
  }

  async function handleSave() {
    setSaving(true)
    setError("")
    setSuccess(false)
    try {
      const res = await fetch("/api/jury/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          juryTitle,
          juryOrganization,
          juryExpertise,
          juryBio,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Kaydedilemedi.")
      } else {
        setSuccess(true)
        router.refresh()
      }
    } catch {
      setError("Beklenmedik hata.")
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col mx-4">

        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-[#e8e8e8]">
          <p className="text-[15px] font-semibold text-[#1c1c1c]">Profili Düzenle</p>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#aeaeb2] hover:text-[#1c1c1c] hover:bg-[#f0f0f0] transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* İçerik */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="py-10 text-center">
              <p className="text-[13px] text-[#aeaeb2]">Yükleniyor…</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-[#6e6e73] mb-1.5">Ad Soyad</label>
                  <input value={name} onChange={(e) => { setName(e.target.value); setSuccess(false) }}
                    placeholder="Ad Soyad" className={inputCls} />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#6e6e73] mb-1.5">E-posta</label>
                  <input value={email} readOnly className={`${inputCls} opacity-60 cursor-not-allowed`} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-[#6e6e73] mb-1.5">Ünvan / Rol</label>
                  <input value={juryTitle} onChange={(e) => { setJuryTitle(e.target.value); setSuccess(false) }}
                    placeholder="Örn: Doç. Dr., CEO" className={inputCls} />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#6e6e73] mb-1.5">Kurum / Organizasyon</label>
                  <input value={juryOrganization} onChange={(e) => { setJuryOrganization(e.target.value); setSuccess(false) }}
                    placeholder="Örn: Boğaziçi Üniversitesi" className={inputCls} />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#6e6e73] mb-2">Uzmanlık Alanları</label>
                <div className="flex flex-wrap gap-2">
                  {EXPERTISE_OPTIONS.map((area) => (
                    <button key={area} type="button" onClick={() => toggleExpertise(area)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all cursor-pointer ${
                        juryExpertise.includes(area)
                          ? "bg-[#1c1c1c] text-white border-[#1c1c1c]"
                          : "bg-[#f5f5f5] text-[#6e6e73] border-transparent hover:bg-[#ebebeb]"
                      }`}>
                      {juryExpertise.includes(area) && <Check className="w-3 h-3" />}
                      {area}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#6e6e73] mb-1.5">Profesyonel Profil</label>
                <textarea value={juryBio} onChange={(e) => { setJuryBio(e.target.value); setSuccess(false) }}
                  rows={3} placeholder="Deneyim, uzmanlık odağı ve değerlendirme perspektifi…"
                  className={`${inputCls} resize-none leading-relaxed`} />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 py-4 border-t border-[#e8e8e8] space-y-2">
          {error && (
            <div className="bg-red-50 rounded-lg px-3 py-2">
              <p className="text-[12px] text-red-600">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-emerald-50 rounded-lg px-3 py-2">
              <p className="text-[12px] text-emerald-700">Profil güncellendi.</p>
            </div>
          )}
          <div className="flex items-center justify-end gap-2">
            <button onClick={onClose}
              className="px-4 py-2.5 text-[13px] font-medium text-[#6e6e73] rounded-xl hover:bg-[#f5f5f5] transition-colors cursor-pointer">
              Kapat
            </button>
            <button onClick={handleSave} disabled={saving || loading}
              className="px-5 py-2.5 bg-[#1c1c1c] text-white text-[13px] font-semibold rounded-xl shadow-sm hover:bg-[#383838] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer">
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

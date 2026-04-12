"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Clock, Briefcase, Building2, Pencil, X, Check } from "lucide-react"

type Member = {
  id: string
  email: string
  name: string | null
  juryTitle: string | null
  juryOrganization: string | null
  juryExpertise: string[]
  juryBio: string | null
  juryActive: boolean
  onboardingCompleted: boolean
  createdAt: Date
  _count: { juryAssignments: number }
}

const EXPERTISE_OPTIONS = [
  "Teknoloji/Girişimcilik",
  "Sanat/Kültürel/İçerik",
  "Araştırma/Akademik",
  "İnovasyon Yönetimi",
  "Sürdürülebilirlik",
  "Sosyal Etki",
]

const inputCls = "w-full px-3 py-2 bg-[#f5f5f5] border border-transparent rounded-lg text-[13px] text-[#1c1c1c] placeholder:text-[#c7c7cc] focus:outline-none focus:ring-2 focus:ring-[#fab758]/50 focus:bg-white focus:border-[#fab758]/30 transition-all"

export function JuryList({ members }: { members: Member[] }) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const pendingRef = useRef(false)

  // Edit form state
  const [editName, setEditName] = useState("")
  const [editTitle, setEditTitle] = useState("")
  const [editOrg, setEditOrg] = useState("")
  const [editExpertise, setEditExpertise] = useState<string[]>([])
  const [editBio, setEditBio] = useState("")

  function startEdit(m: Member) {
    setEditingId(m.id)
    setEditName(m.name ?? "")
    setEditTitle(m.juryTitle ?? "")
    setEditOrg(m.juryOrganization ?? "")
    setEditExpertise(m.juryExpertise ?? [])
    setEditBio(m.juryBio ?? "")
  }

  function cancelEdit() {
    setEditingId(null)
  }

  function toggleExpertise(area: string) {
    setEditExpertise((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    )
  }

  async function saveEdit(id: string) {
    if (pendingRef.current) return
    pendingRef.current = true
    setSaving(true)
    try {
      await fetch(`/api/admin/jury/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName || undefined,
          juryTitle: editTitle,
          juryOrganization: editOrg,
          juryExpertise: editExpertise,
          juryBio: editBio,
        }),
      })
      setEditingId(null)
      router.refresh()
    } finally {
      pendingRef.current = false
      setSaving(false)
    }
  }

  async function toggleActive(m: Member) {
    if (pendingRef.current) return
    pendingRef.current = true
    setTogglingId(m.id)
    try {
      await fetch(`/api/admin/jury/${m.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ juryActive: !m.juryActive }),
      })
      router.refresh()
    } finally {
      pendingRef.current = false
      setTogglingId(null)
    }
  }

  if (members.length === 0) {
    return (
      <p className="text-[13px] text-[#aeaeb2] py-8 text-center">
        Henüz jüri üyesi yok. Sol taraftaki formu kullanarak davet gönderin.
      </p>
    )
  }

  return (
    <div className="divide-y divide-black/[0.04]">
      {members.map((m) => (
        <div key={m.id} className="py-4">
          {editingId === m.id ? (
            /* ── Düzenleme modu ── */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-semibold text-[#6e6e73]">Düzenle: {m.email}</p>
                <button onClick={cancelEdit} className="p-1 rounded-lg text-[#aeaeb2] hover:text-[#1c1c1c] hover:bg-[#f0f0f0] transition-colors cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-[#aeaeb2] mb-1">Ad Soyad</label>
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Ad Soyad" className={inputCls} />
                </div>
                <div>
                  <label className="block text-[11px] text-[#aeaeb2] mb-1">Ünvan / Rol</label>
                  <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Örn: Doç. Dr." className={inputCls} />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-[#aeaeb2] mb-1">Kurum / Organizasyon</label>
                <input value={editOrg} onChange={(e) => setEditOrg(e.target.value)} placeholder="Örn: Boğaziçi Üniversitesi" className={inputCls} />
              </div>

              <div>
                <label className="block text-[11px] text-[#aeaeb2] mb-1.5">Uzmanlık Alanları</label>
                <div className="flex flex-wrap gap-1.5">
                  {EXPERTISE_OPTIONS.map((area) => (
                    <button key={area} type="button" onClick={() => toggleExpertise(area)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all cursor-pointer ${
                        editExpertise.includes(area)
                          ? "bg-[#1c1c1c] text-white border-[#1c1c1c]"
                          : "bg-[#f5f5f5] text-[#6e6e73] border-transparent hover:bg-[#ebebeb]"
                      }`}>
                      {editExpertise.includes(area) && <Check className="w-2.5 h-2.5" />}
                      {area}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-[#aeaeb2] mb-1">Profesyonel Profil</label>
                <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={2}
                  placeholder="Kısa açıklama…" className={`${inputCls} resize-none`} />
              </div>

              <div className="flex justify-end gap-2">
                <button onClick={cancelEdit}
                  className="px-3 py-1.5 text-[12px] text-[#6e6e73] rounded-lg hover:bg-[#f0f0f0] transition-colors cursor-pointer">
                  İptal
                </button>
                <button onClick={() => saveEdit(m.id)} disabled={saving}
                  className="px-4 py-1.5 text-[12px] font-semibold bg-[#1c1c1c] text-white rounded-lg hover:bg-[#383838] disabled:opacity-50 transition-colors cursor-pointer">
                  {saving ? "Kaydediliyor…" : "Kaydet"}
                </button>
              </div>
            </div>
          ) : (
            /* ── Görüntüleme modu ── */
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className={`text-[14px] font-semibold truncate ${m.juryActive ? "text-[#1c1c1c]" : "text-[#aeaeb2]"}`}>
                    {m.name ?? m.email}
                  </p>
                  <p className="text-[12px] text-[#6e6e73] truncate">{m.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-[#aeaeb2] tabular-nums">{m._count.juryAssignments} atama</span>

                  {/* Aktif/Pasif toggle */}
                  <button
                    onClick={() => toggleActive(m)}
                    disabled={togglingId === m.id}
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-2.5 py-1 transition-colors cursor-pointer disabled:opacity-50 ${
                      m.juryActive
                        ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                        : "text-[#aeaeb2] bg-[#f0f0f0] hover:bg-[#e5e5e5]"
                    }`}
                    title={m.juryActive ? "Pasife al" : "Aktife al"}
                  >
                    {m.juryActive ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {togglingId === m.id ? "…" : m.juryActive ? "Aktif" : "Pasif"}
                  </button>

                  {/* Düzenle */}
                  <button onClick={() => startEdit(m)}
                    className="p-1.5 rounded-lg text-[#aeaeb2] hover:text-[#1c1c1c] hover:bg-[#f0f0f0] transition-colors cursor-pointer"
                    title="Düzenle">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {(m.juryTitle || m.juryOrganization) && (
                <div className="flex items-center gap-3 flex-wrap text-[12px] text-[#6e6e73]">
                  {m.juryTitle && (
                    <span className="inline-flex items-center gap-1">
                      <Briefcase className="w-3 h-3 text-[#aeaeb2]" /> {m.juryTitle}
                    </span>
                  )}
                  {m.juryOrganization && (
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-[#aeaeb2]" /> {m.juryOrganization}
                    </span>
                  )}
                </div>
              )}

              {m.juryExpertise.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {m.juryExpertise.map((area) => (
                    <span key={area} className="text-[11px] font-medium bg-[#f0f0f0] text-[#6e6e73] px-2 py-0.5 rounded-full">
                      {area}
                    </span>
                  ))}
                </div>
              )}

              {m.juryBio && (
                <p className="text-[12px] text-[#aeaeb2] leading-relaxed line-clamp-2">{m.juryBio}</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

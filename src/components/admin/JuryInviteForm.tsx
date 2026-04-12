"use client"

import { useState } from "react"
import { CheckCircle2, Check } from "lucide-react"
import { useRouter } from "next/navigation"

const EXPERTISE_OPTIONS = [
  "Teknoloji/Girişimcilik",
  "Sanat/Kültürel/İçerik",
  "Araştırma/Akademik",
  "İnovasyon Yönetimi",
  "Sürdürülebilirlik",
  "Sosyal Etki",
]

const inputCls = "w-full px-3.5 py-2.5 bg-[#f5f5f5] border border-transparent rounded-xl text-[14px] text-[#1c1c1c] placeholder:text-[#c7c7cc] focus:outline-none focus:ring-2 focus:ring-[#fab758]/50 focus:bg-white focus:border-[#fab758]/30 transition-all"

export function JuryInviteForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [juryTitle, setJuryTitle] = useState("")
  const [juryOrganization, setJuryOrganization] = useState("")
  const [juryExpertise, setJuryExpertise] = useState<string[]>([])
  const [juryBio, setJuryBio] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [magicLink, setMagicLink] = useState("")
  const [emailError, setEmailError] = useState("")

  function toggleExpertise(area: string) {
    setJuryExpertise((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("loading")
    setMessage("")
    setMagicLink("")
    setEmailError("")

    try {
      const res = await fetch("/api/admin/jury/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: name || undefined,
          juryTitle: juryTitle || undefined,
          juryOrganization: juryOrganization || undefined,
          juryExpertise: juryExpertise.length > 0 ? juryExpertise : undefined,
          juryBio: juryBio || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setStatus("error")
        setMessage(data.error ?? "Davet gönderilemedi.")
        return
      }

      setStatus("success")
      setMessage(data.message ?? `Davet gönderildi: ${email}`)
      if (data.magicLink) setMagicLink(data.magicLink)
      if (data.emailError) setEmailError(data.emailError)
      setEmail("")
      setName("")
      setJuryTitle("")
      setJuryOrganization("")
      setJuryExpertise([])
      setJuryBio("")
      router.refresh()
    } catch {
      setStatus("error")
      setMessage("Beklenmedik bir hata oluştu.")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[12px] font-medium text-[#6e6e73] mb-1.5">
            E-posta <span className="text-red-500">*</span>
          </label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            required placeholder="juri@ornek.com" className={inputCls} />
        </div>
        <div>
          <label className="block text-[12px] font-medium text-[#6e6e73] mb-1.5">
            Ad Soyad <span className="text-red-500">*</span>
          </label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            required placeholder="Adı Soyadı" className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[12px] font-medium text-[#6e6e73] mb-1.5">Ünvan / Rol</label>
          <input type="text" value={juryTitle} onChange={(e) => setJuryTitle(e.target.value)}
            placeholder="Örn: Doç. Dr., CEO" className={inputCls} />
        </div>
        <div>
          <label className="block text-[12px] font-medium text-[#6e6e73] mb-1.5">Kurum / Organizasyon</label>
          <input type="text" value={juryOrganization} onChange={(e) => setJuryOrganization(e.target.value)}
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
        <textarea value={juryBio} onChange={(e) => setJuryBio(e.target.value)} rows={3}
          placeholder="Deneyim, uzmanlık odağı ve değerlendirme perspektifi…"
          className={`${inputCls} resize-none leading-relaxed`} />
      </div>

      {status === "success" && (
        <div className="space-y-2">
          <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div className="text-[13px] text-emerald-700 min-w-0">
              <p>{message}</p>
              {magicLink && (
                <div className="mt-2 space-y-1">
                  <p className="font-semibold text-emerald-800">Davet Linki:</p>
                  <p className="break-all text-[11px] font-mono bg-emerald-100 px-2 py-1.5 rounded-lg">{magicLink}</p>
                  <button type="button" onClick={() => navigator.clipboard.writeText(magicLink)}
                    className="text-[11px] font-semibold text-emerald-700 underline cursor-pointer">Kopyala</button>
                </div>
              )}
            </div>
          </div>
          {emailError && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
              <p className="text-[12px] text-amber-700"><span className="font-semibold">E-posta hatası:</span> {emailError}</p>
            </div>
          )}
        </div>
      )}

      {status === "error" && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <p className="text-[13px] text-red-600">{message}</p>
        </div>
      )}

      <button type="submit" disabled={status === "loading"}
        className="w-full py-2.5 bg-[#1c1c1c] text-white text-[13px] font-semibold rounded-xl shadow-sm hover:bg-[#383838] hover:shadow disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer">
        {status === "loading" ? "Gönderiliyor…" : "Davet Gönder"}
      </button>
    </form>
  )
}

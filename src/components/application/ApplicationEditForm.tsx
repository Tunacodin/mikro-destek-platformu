"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check } from "lucide-react"

const EDUCATION_OPTIONS = [
  "Lise Öğrencisi", "Lise Mezunu",
  "Ön Lisans Öğrencisi", "Ön Lisans Mezunu",
  "Lisans Öğrencisi", "Lisans Mezunu",
  "Yüksek Lisans Öğrencisi", "Yüksek Lisans Mezunu",
  "Doktora Öğrencisi / Mezunu",
]

const CATEGORIES = [
  "Teknoloji/Girişimcilik",
  "Sanat/Kültürel/İçerik",
  "Araştırma/Akademik",
]

const STAGES: Record<string, string[]> = {
  "Teknoloji/Girişimcilik": ["Fikir", "Doğrulama", "MVP", "Büyüme", "Ölçeklendirme"],
  "Sanat/Kültürel/İçerik":  ["Taslak", "Prototip", "Üretimde", "Tamamlandı", "Sergileniyor"],
  "Araştırma/Akademik":     ["Problem Tespiti", "Literatür Taraması", "Veri Toplama", "Analiz", "Yayın"],
}

const SUPPORT_TYPES = [
  "Üretim ve Altyapı Desteği",
  "Yazılım ve Teknik Araç Desteği",
  "Materyal ve Envanter Desteği",
  "Mentorluk ve Uzmanlık Desteği",
  "Görünürlük ve Ağ Desteği",
  "Akademik Üretim Desteği",
  "Telif, Hak ve Yayıncılık Desteği",
  "Dış Temsil ve Seyahat Desteği",
]

type Application = {
  id:                    string
  title:                 string
  teamName:              string | null
  teamInfo:              string | null
  summary:               string | null
  targetAudience:        string | null
  categories:            string[]
  technologyStage:       string | null
  artStage:              string | null
  researchStage:         string | null
  problemStatement:      string | null
  solution:              string | null
  innovation:            string | null
  outputs:               string | null
  timeline:              string | null
  successCriteria:       string | null
  ecosystemCollaboration:string | null
  communityContribution: string | null
  divisionContribution:  string | null
  supportTypes:          string[]
}

type UserProfile = {
  name:               string | null
  email:              string
  phone:              string | null
  educationStatus:    string | null
  department:         string | null
  address:            string | null
  communityProfileUrl:string | null
  linkedinUrl:        string | null
  twitterUrl:         string | null
}

const inputCls = "w-full px-3.5 py-2.5 bg-[#f5f5f5] border border-transparent rounded-xl text-[14px] text-[#1c1c1c] placeholder:text-[#c7c7cc] focus:outline-none focus:ring-2 focus:ring-[#fab758]/50 focus:bg-white focus:border-[#fab758]/30 transition-all"
const textareaCls = `${inputCls} resize-none leading-relaxed`

function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-1.5">
      <label className="block text-[12px] font-medium text-[#6e6e73]">{children}</label>
      {hint && <p className="text-[11px] text-[#aeaeb2] mt-0.5 leading-snug">{hint}</p>}
    </div>
  )
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-[0.12em] pb-2 border-b border-black/[0.04]">
      {children}
    </p>
  )
}

export function ApplicationEditForm({
  application, userProfile, locked,
}: {
  application: Application
  userProfile: UserProfile
  locked: boolean
}) {
  const router = useRouter()

  // Profil alanları
  const [name,               setName]               = useState(userProfile.name               ?? "")
  const [phone,              setPhone]              = useState(userProfile.phone              ?? "")
  const [educationStatus,    setEducationStatus]    = useState(userProfile.educationStatus    ?? "")
  const [department,         setDepartment]         = useState(userProfile.department         ?? "")
  const [address,            setAddress]            = useState(userProfile.address            ?? "")
  const [communityProfileUrl,setCommunityProfileUrl]= useState(userProfile.communityProfileUrl ?? "")
  const [linkedinUrl,        setLinkedinUrl]        = useState(userProfile.linkedinUrl        ?? "")
  const [twitterUrl,         setTwitterUrl]         = useState(userProfile.twitterUrl         ?? "")

  // Başvuru alanları
  const [title,         setTitle]         = useState(application.title)
  const [teamName,      setTeamName]      = useState(application.teamName             ?? "")
  const [teamInfo,      setTeamInfo]      = useState(application.teamInfo              ?? "")
  const [summary,       setSummary]       = useState(application.summary               ?? "")
  const [targetAudience,setTargetAudience]= useState(application.targetAudience        ?? "")
  const [categories,    setCategories]    = useState<string[]>(application.categories  ?? [])
  const [technologyStage, setTechnologyStage] = useState(application.technologyStage   ?? "")
  const [artStage,        setArtStage]        = useState(application.artStage          ?? "")
  const [researchStage,   setResearchStage]   = useState(application.researchStage     ?? "")
  const [problemStatement,setProblemStatement]= useState(application.problemStatement  ?? "")
  const [solution,        setSolution]        = useState(application.solution          ?? "")
  const [innovation,      setInnovation]      = useState(application.innovation        ?? "")
  const [outputs,         setOutputs]         = useState(application.outputs           ?? "")
  const [timeline,        setTimeline]        = useState(application.timeline          ?? "")
  const [successCriteria, setSuccessCriteria] = useState(application.successCriteria   ?? "")
  const [ecosystemCollaboration, setEcosystemCollaboration] = useState(application.ecosystemCollaboration ?? "")
  const [communityContribution,  setCommunityContribution]  = useState(application.communityContribution  ?? "")
  const [divisionContribution,   setDivisionContribution]   = useState(application.divisionContribution   ?? "")
  const [supportTypes,    setSupportTypes]    = useState<string[]>(application.supportTypes ?? [])

  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)
  const [saved,  setSaved]  = useState(false)

  function toggleCategory(cat: string) {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : prev.length < 2 ? [...prev, cat] : prev
    )
    setSaved(false)
  }

  function toggleSupportType(type: string) {
    setSupportTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true); setError(null); setSaved(false)

    // Profili güncelle
    const profileRes = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, educationStatus, department, address, communityProfileUrl, linkedinUrl, twitterUrl }),
    })
    if (!profileRes.ok) {
      const d = await profileRes.json().catch(() => ({}))
      setError(d.error ?? "Profil güncellenemedi.")
      setSaving(false)
      return
    }

    // Başvuruyu güncelle
    const appRes = await fetch(`/api/applications/${application.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        teamName, teamInfo, summary, targetAudience, categories,
        technologyStage, artStage, researchStage,
        problemStatement, solution, innovation,
        outputs, timeline, successCriteria,
        ecosystemCollaboration, communityContribution, divisionContribution,
        supportTypes,
      }),
    })
    const data = await appRes.json()
    if (!appRes.ok) setError(data.error ?? "Bir hata oluştu.")
    else { setSaved(true); router.refresh() }
    setSaving(false)
  }

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

  const field = (label: string, value: string, onChange: (v: string) => void, hint?: string, placeholder?: string) => (
    <div>
      <Label hint={hint}>{label}</Label>
      <input className={inputCls} value={value} onChange={(e) => { onChange(e.target.value); setSaved(false) }} placeholder={placeholder} />
    </div>
  )

  const textarea = (label: string, value: string, onChange: (v: string) => void, rows = 4, hint?: string, maxLen?: number) => (
    <div>
      <Label hint={hint}>{label}</Label>
      <div className="relative">
        <textarea
          className={textareaCls}
          rows={rows}
          value={value}
          onChange={(e) => { if (!maxLen || e.target.value.length <= maxLen) { onChange(e.target.value); setSaved(false) } }}
          placeholder=""
        />
        {maxLen && (
          <span className={`absolute bottom-2.5 right-3.5 text-[11px] tabular-nums ${value.length >= maxLen * 0.93 ? "text-amber-500" : "text-[#aeaeb2]"}`}>
            {value.length}/{maxLen}
          </span>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">

      {/* Kişisel Bilgiler */}
      <div className="space-y-3">
        <SectionHeader>Kişisel Bilgiler</SectionHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {field("Adın Soyadın", name, setName, undefined, "Ad Soyad")}
          {field("Telefon Numarası", phone, setPhone, undefined, "+90 5xx xxx xx xx")}
        </div>
        <div>
          <Label>Öğrenim Durumu</Label>
          <div className="relative">
            <select
              value={educationStatus}
              onChange={(e) => { setEducationStatus(e.target.value); setSaved(false) }}
              className="w-full px-3.5 py-2.5 bg-[#f5f5f5] border border-transparent rounded-xl text-[14px] text-[#1c1c1c] focus:outline-none focus:ring-2 focus:ring-[#fab758]/50 focus:bg-white focus:border-[#fab758]/30 transition-all appearance-none cursor-pointer"
            >
              <option value="">Seçiniz</option>
              {EDUCATION_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#aeaeb2]">
              <svg width="10" height="6" fill="none" viewBox="0 0 10 6"><path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
        </div>
        {field("Bölüm / Alan", department, setDepartment)}
        {field("Adres", address, setAddress)}
        <div>
          <Label>E-Posta</Label>
          <input className={`${inputCls} opacity-60`} value={userProfile.email} readOnly />
        </div>
        {field("Divizyon Profil Linki", communityProfileUrl, setCommunityProfileUrl, undefined, "https://...")}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {field("LinkedIn", linkedinUrl, setLinkedinUrl, undefined, "https://linkedin.com/in/...")}
          {field("X (Twitter)", twitterUrl, setTwitterUrl, undefined, "@kullaniciadi")}
        </div>
      </div>

      {/* Proje Kimliği */}
      <div className="space-y-3">
        <SectionHeader>Proje Kimliği</SectionHeader>
        {field("Proje Adı", title, setTitle)}
        {field("Ekip / Takım Adı", teamName, setTeamName, undefined, "Örn: İnovasyon Takımı")}
        {textarea("Ekip Bilgileri", teamInfo, setTeamInfo, 3, "Ekip üyelerinin adı, rolü ve iletişim bilgileri.")}
        {textarea("30 Saniyelik Proje Özeti", summary, setSummary, 4, "Projenin ne olduğunu, hangi sorunu çözdüğünü ve temel amacını özetleyiniz.", 1500)}
        {textarea("Hedef Kitle", targetAudience, setTargetAudience, 3, "Bu projeden doğrudan fayda sağlayacak ana kitle kimdir?", 1500)}

        {/* Kategoriler */}
        <div>
          <Label hint="En fazla 2 alan seçilebilir.">Proje Alanı</Label>
          <div className="flex flex-col gap-2">
            {CATEGORIES.map((cat) => (
              <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                <div
                  onClick={() => toggleCategory(cat)}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                    categories.includes(cat)
                      ? "bg-[#212121] border-[#212121]"
                      : categories.length >= 2
                      ? "border-[#e0e0e0] opacity-40 cursor-not-allowed"
                      : "border-[#d1d1d6] group-hover:border-[#aeaeb2]"
                  }`}
                >
                  {categories.includes(cat) && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-[13px] text-[#1c1c1c]">{cat}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Aşama seçicileri */}
        {categories.includes("Teknoloji/Girişimcilik") && (
          <StageEdit label="Teknoloji/Girişimcilik — Aşama" options={STAGES["Teknoloji/Girişimcilik"]} value={technologyStage} onChange={(v) => { setTechnologyStage(v); setSaved(false) }} />
        )}
        {categories.includes("Sanat/Kültürel/İçerik") && (
          <StageEdit label="Sanat/Kültürel/İçerik — Aşama" options={STAGES["Sanat/Kültürel/İçerik"]} value={artStage} onChange={(v) => { setArtStage(v); setSaved(false) }} />
        )}
        {categories.includes("Araştırma/Akademik") && (
          <StageEdit label="Araştırma/Akademik — Aşama" options={STAGES["Araştırma/Akademik"]} value={researchStage} onChange={(v) => { setResearchStage(v); setSaved(false) }} />
        )}
      </div>

      {/* Problem & Çözüm */}
      <div className="space-y-3">
        <SectionHeader>Problem & Çözüm</SectionHeader>
        {textarea("Problem / İhtiyaç Tanımı", problemStatement, setProblemStatement, 5, "Projeniz hangi somut sorunu çözmeyi hedefliyor?")}
        {textarea("Çözüm / Ürün / Hizmet", solution, setSolution, 5, "Ne tür bir çözüm, ürün, eser, hizmet veya içerik sunuyorsunuz?")}
        {textarea("Yenilik / Özgünlük", innovation, setInnovation, 4, "Projenizi mevcut benzerlerinden ayıran temel yenilikler nelerdir?")}
      </div>

      {/* Plan & Hedefler */}
      <div className="space-y-3">
        <SectionHeader>Plan & Hedefler</SectionHeader>
        {textarea("Somut Çıktılar", outputs, setOutputs, 4, "Destek sürecinin sonunda elde etmeyi planladığınız somut ve ölçülebilir çıktılar nelerdir?")}
        {textarea("Zaman Çizelgesi", timeline, setTimeline, 4, "Planlanan aşamalar ve yaklaşık süreler.")}
        {textarea("Başarı Kriterleri", successCriteria, setSuccessCriteria, 4, "Projenizin başarılı sayılabilmesi için ulaşmayı hedeflediğiniz ölçülebilir hedefler.")}
      </div>

      {/* Ekosistem & Topluluk */}
      <div className="space-y-3">
        <SectionHeader>Ekosistem & Topluluk</SectionHeader>
        {textarea("Ekosistem İşbirliği Planı", ecosystemCollaboration, setEcosystemCollaboration, 4, "Divizyon ekosistemiyle nasıl işbirliği kurmayı planlıyorsunuz?")}
        {textarea("Topluluk Katkısı", communityContribution, setCommunityContribution, 4, "Projeniz Divizyon topluluğuna ne gibi bir fayda sağlayacak?")}
        {textarea("Divizyon'a Katkı", divisionContribution, setDivisionContribution, 4, "Projenizin başarısı Divizyon'un kurumsal itibarına nasıl katkı sağlayabilir?")}
      </div>

      {/* Destek Türleri */}
      <div className="space-y-3">
        <SectionHeader>İhtiyaç Duyulan Destek Türleri</SectionHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SUPPORT_TYPES.map((type) => (
            <label key={type} className="flex items-center gap-3 cursor-pointer group p-2 rounded-xl hover:bg-[#f5f5f5] transition-colors">
              <div
                onClick={() => toggleSupportType(type)}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                  supportTypes.includes(type) ? "bg-[#212121] border-[#212121]" : "border-[#d1d1d6] group-hover:border-[#aeaeb2]"
                }`}
              >
                {supportTypes.includes(type) && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className="text-[13px] text-[#1c1c1c] leading-snug">{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Geri bildirim & kaydet */}
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
        disabled={saving}
        className="px-4 py-2.5 bg-[#212121] text-white text-[13px] font-semibold rounded-xl shadow-sm hover:bg-[#383838] hover:shadow disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        {saving ? "Kaydediliyor…" : "Kaydet"}
      </button>
    </div>
  )
}

function StageEdit({ label, options, value, onChange }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`px-3 py-1.5 rounded-xl text-[12px] font-medium border transition-all cursor-pointer ${
              value === opt ? "bg-[#212121] text-white border-[#212121]" : "bg-[#f5f5f5] text-[#6e6e73] border-transparent hover:bg-[#ebebeb]"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

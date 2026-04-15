"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, ChevronRight, ChevronLeft, Save, AlertCircle } from "lucide-react"

// ── Sabitler ──────────────────────────────────────────────────────────────────

const STEPS = [
  { label: "Kişisel Bilgiler", short: "Kişisel"  },
  { label: "Proje Kimliği",    short: "Kimlik"    },
  { label: "Problem & Çözüm", short: "Problem"   },
  { label: "Plan & Hedefler",  short: "Plan"      },
  { label: "Ekosistem",        short: "Ekosistem" },
  { label: "Destek & Kaydet",  short: "Kaydet"    },
]

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

// ── Tipler ────────────────────────────────────────────────────────────────────

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
  supportNotes:          Record<string, string> | null
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

// ── Yardımcı bileşenler ───────────────────────────────────────────────────────

const inputCls = "w-full px-3.5 py-2.5 bg-[#f5f5f5] border border-transparent rounded-xl text-[14px] text-[#1c1c1c] placeholder:text-[#c7c7cc] focus:outline-none focus:ring-2 focus:ring-[#fab758]/50 focus:bg-white focus:border-[#fab758]/30 transition-all"
const textareaCls = `${inputCls} resize-none leading-relaxed`

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold text-[#aeaeb2] uppercase tracking-[0.12em] pb-1 border-b border-black/[0.04]">
      {children}
    </p>
  )
}

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-0.5 mb-1.5">
      <label className="block text-[13px] font-semibold text-[#1c1c1c]">{children}</label>
      {hint && <p className="text-[11px] text-[#6e6e73] leading-snug">{hint}</p>}
    </div>
  )
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
      <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
      <p className="text-[13px] text-red-600">{message}</p>
    </div>
  )
}

function SelectField({
  value, onChange, options, placeholder,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder?: string
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 bg-[#f5f5f5] border border-transparent rounded-xl text-[14px] text-[#1c1c1c] focus:outline-none focus:ring-2 focus:ring-[#fab758]/50 focus:bg-white focus:border-[#fab758]/30 transition-all appearance-none cursor-pointer"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#aeaeb2]">
        <svg width="10" height="6" fill="none" viewBox="0 0 10 6">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  )
}

function StageSelector({ label, options, value, onChange }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
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

function NavButtons({
  onBack, onNext, nextLabel = "Devam", loading, disabled,
}: {
  onBack?: () => void
  onNext: () => void
  nextLabel?: string
  loading?: boolean
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between pt-2">
      {onBack ? (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-[#6e6e73] text-[13px] font-medium rounded-xl hover:bg-[#ebebeb] transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" /> Geri
        </button>
      ) : <div />}
      <button
        onClick={onNext}
        disabled={loading || disabled}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#212121] text-white text-[13px] font-semibold rounded-xl shadow-sm hover:bg-[#383838] hover:shadow disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        {loading
          ? "Kaydediliyor…"
          : <><span>{nextLabel}</span><ChevronRight className="w-4 h-4" /></>}
      </button>
    </div>
  )
}

// ── Ana bileşen ───────────────────────────────────────────────────────────────

export function ApplicationEditForm({
  application, userProfile,
}: {
  application: Application
  userProfile: UserProfile
  locked: boolean
}) {
  const router = useRouter()

  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  // Profil
  const [name,               setName]               = useState(userProfile.name               ?? "")
  const [phone,              setPhone]              = useState(userProfile.phone              ?? "")
  const [educationStatus,    setEducationStatus]    = useState(userProfile.educationStatus    ?? "")
  const [department,         setDepartment]         = useState(userProfile.department         ?? "")
  const [address,            setAddress]            = useState(userProfile.address            ?? "")
  const [communityProfileUrl,setCommunityProfileUrl]= useState(userProfile.communityProfileUrl ?? "")
  const [linkedinUrl,        setLinkedinUrl]        = useState(userProfile.linkedinUrl        ?? "")
  const [twitterUrl,         setTwitterUrl]         = useState(userProfile.twitterUrl         ?? "")

  // Başvuru
  const [title,                  setTitle]                  = useState(application.title)
  const [teamName,               setTeamName]               = useState(application.teamName              ?? "")
  const [teamInfo,               setTeamInfo]               = useState(application.teamInfo               ?? "")
  const [summary,                setSummary]                = useState(application.summary                ?? "")
  const [targetAudience,         setTargetAudience]         = useState(application.targetAudience         ?? "")
  const [categories,             setCategories]             = useState<string[]>(application.categories   ?? [])
  const [technologyStage,        setTechnologyStage]        = useState(application.technologyStage        ?? "")
  const [artStage,               setArtStage]               = useState(application.artStage               ?? "")
  const [researchStage,          setResearchStage]          = useState(application.researchStage          ?? "")
  const [problemStatement,       setProblemStatement]       = useState(application.problemStatement       ?? "")
  const [solution,               setSolution]               = useState(application.solution               ?? "")
  const [innovation,             setInnovation]             = useState(application.innovation             ?? "")
  const [outputs,                setOutputs]                = useState(application.outputs                ?? "")
  const [timeline,               setTimeline]               = useState(application.timeline               ?? "")
  const [successCriteria,        setSuccessCriteria]        = useState(application.successCriteria        ?? "")
  const [ecosystemCollaboration, setEcosystemCollaboration] = useState(application.ecosystemCollaboration ?? "")
  const [communityContribution,  setCommunityContribution]  = useState(application.communityContribution  ?? "")
  const [divisionContribution,   setDivisionContribution]   = useState(application.divisionContribution   ?? "")
  const [supportTypes,           setSupportTypes]           = useState<string[]>(application.supportTypes ?? [])
  const [supportNotes,           setSupportNotes]           = useState<Record<string, string>>(application.supportNotes ?? {})

  function toggleCategory(cat: string) {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : prev.length < 2 ? [...prev, cat] : prev
    )
  }

  function toggleSupportType(type: string) {
    setSupportTypes((prev) => {
      if (prev.includes(type)) {
        setSupportNotes((n) => { const next = { ...n }; delete next[type]; return next })
        return prev.filter((t) => t !== type)
      }
      return [...prev, type]
    })
  }

  function updateSupportNote(type: string, note: string) {
    setSupportNotes((prev) => ({ ...prev, [type]: note }))
  }

  function goBack() { setError(""); setStep((s) => s - 1) }

  // Adım validasyonları
  function handleStep0() {
    setError("")
    if (!name.trim())                return setError("Adınız ve soyadınız zorunludur.")
    if (!phone.trim())               return setError("Telefon numarası zorunludur.")
    if (!educationStatus)            return setError("Öğrenim durumunuzu seçiniz.")
    if (!department.trim())          return setError("Bölüm/alan bilgisi zorunludur.")
    if (!address.trim())             return setError("Adres zorunludur.")
    if (!communityProfileUrl.trim()) return setError("Divizyon profil linki zorunludur.")
    setStep(1)
  }

  function handleStep1() {
    setError("")
    if (!title.trim())           return setError("Proje adı zorunludur.")
    if (!summary.trim())         return setError("30 saniyelik özet zorunludur.")
    if (!targetAudience.trim())  return setError("Hedef kitle zorunludur.")
    if (categories.length === 0) return setError("En az bir proje alanı seçiniz.")
    if (categories.includes("Teknoloji/Girişimcilik") && !technologyStage) return setError("Teknoloji/Girişimcilik için proje aşamasını seçiniz.")
    if (categories.includes("Sanat/Kültürel/İçerik")  && !artStage)        return setError("Sanat/Kültürel/İçerik için proje aşamasını seçiniz.")
    if (categories.includes("Araştırma/Akademik")      && !researchStage)   return setError("Araştırma/Akademik için proje aşamasını seçiniz.")
    setStep(2)
  }

  function handleStep2() {
    setError("")
    if (!problemStatement.trim()) return setError("Problem/ihtiyaç tanımı zorunludur.")
    if (!solution.trim())         return setError("Çözüm/ürün/hizmet tanımı zorunludur.")
    if (!innovation.trim())       return setError("Yenilik/özgünlük açıklaması zorunludur.")
    setStep(3)
  }

  function handleStep3() {
    setError("")
    if (!outputs.trim())         return setError("Somut çıktılar zorunludur.")
    if (!timeline.trim())        return setError("Zaman çizelgesi zorunludur.")
    if (!successCriteria.trim()) return setError("Başarı kriterleri zorunludur.")
    setStep(4)
  }

  function handleStep4() {
    setError("")
    if (!ecosystemCollaboration.trim()) return setError("Ekosistem işbirliği planı zorunludur.")
    if (!communityContribution.trim())  return setError("Topluluk katkısı zorunludur.")
    if (!divisionContribution.trim())   return setError("Divizyon katkısı zorunludur.")
    setStep(5)
  }

  async function handleSave() {
    setError("")
    if (supportTypes.length === 0) return setError("En az bir destek türü seçiniz.")
    setSaving(true)

    try {
      const profileRes = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, educationStatus, department, address, communityProfileUrl, linkedinUrl, twitterUrl }),
      })
      if (!profileRes.ok) {
        const d = await profileRes.json().catch(() => ({}))
        setError(d.error ?? "Profil güncellenemedi.")
        return
      }

      const appRes = await fetch(`/api/applications/${application.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(), teamName, teamInfo, summary, targetAudience, categories,
          technologyStage, artStage, researchStage,
          problemStatement, solution, innovation,
          outputs, timeline, successCriteria,
          ecosystemCollaboration, communityContribution, divisionContribution,
          supportTypes, supportNotes,
        }),
      })
      const data = await appRes.json()
      if (!appRes.ok) { setError(data.error ?? "Bir hata oluştu."); return }

      router.refresh()
      router.push(`/dashboard/applications/${application.id}?saved=1`)
    } catch {
      setError("Beklenmedik bir hata oluştu.")
    } finally {
      setSaving(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Step indicator */}
      <div className="relative">
        <div className="absolute left-0 right-0 top-4 h-0.5 bg-[#e5e5e5]" />
        <div
          className="absolute left-0 top-4 h-0.5 bg-[#212121] transition-all duration-500 ease-out"
          style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
        />
        <div className="relative flex items-start justify-between">
          {STEPS.map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-2 flex-1 first:items-start last:items-end">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold transition-all border-2 ${
                i < step   ? "bg-[#212121] border-[#212121] text-white"
                : i === step ? "bg-white border-[#212121] text-[#212121]"
                : "bg-white border-[#e0e0e0] text-[#aeaeb2]"
              }`}>
                {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className={`hidden sm:block text-[11px] font-semibold transition-colors ${
                i === step ? "text-[#1c1c1c]" : i < step ? "text-[#6e6e73]" : "text-[#aeaeb2]"
              }`}>{s.label}</span>
              <span className={`sm:hidden text-[10px] font-semibold transition-colors ${
                i === step ? "text-[#1c1c1c]" : i < step ? "text-[#6e6e73]" : "text-[#aeaeb2]"
              }`}>{s.short}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form kartı */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)]">

        {/* ── ADIM 0: Kişisel Bilgiler ─────────────────────────────────────── */}
        {step === 0 && (
          <div className="p-5 sm:p-6 space-y-4">
            <SectionTitle>Kişisel Bilgiler</SectionTitle>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Adın Soyadın</FieldLabel>
                <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ad Soyad" />
              </div>
              <div>
                <FieldLabel>Telefon Numaran</FieldLabel>
                <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+90 5xx xxx xx xx" />
              </div>
            </div>

            <div>
              <FieldLabel>Öğrenim Durumun</FieldLabel>
              <SelectField value={educationStatus} onChange={setEducationStatus} options={EDUCATION_OPTIONS} placeholder="Seçiniz" />
            </div>

            <div>
              <FieldLabel>Mezun Olduğun / Öğrencisi Olduğun Bölüm</FieldLabel>
              <input className={inputCls} value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Örn: Bilgisayar Mühendisliği" />
            </div>

            <div>
              <FieldLabel>Adresin</FieldLabel>
              <input className={inputCls} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="İlçe, Şehir" />
            </div>

            <div>
              <FieldLabel>E-Posta Adresin</FieldLabel>
              <input className={`${inputCls} opacity-60`} value={userProfile.email} readOnly />
            </div>

            <div>
              <FieldLabel>Divizyon | Komünite Profil Linkin</FieldLabel>
              <input className={inputCls} value={communityProfileUrl} onChange={(e) => setCommunityProfileUrl(e.target.value)} placeholder="https://..." />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>LinkedIn Adresin</FieldLabel>
                <input className={inputCls} value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/..." />
              </div>
              <div>
                <FieldLabel>X (Twitter) Adresin</FieldLabel>
                <input className={inputCls} value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} placeholder="@kullaniciadi" />
              </div>
            </div>

            {error && <ErrorBox message={error} />}
            <NavButtons onNext={handleStep0} />
          </div>
        )}

        {/* ── ADIM 1: Proje Kimliği ─────────────────────────────────────────── */}
        {step === 1 && (
          <div className="p-5 sm:p-6 space-y-4">
            <SectionTitle>Proje Kimliği</SectionTitle>

            <div>
              <FieldLabel hint="Projenizi en iyi tanımlayan, akılda kalıcı ve net bir isim belirtiniz.">
                Proje Adı
              </FieldLabel>
              <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Projenizin adı" />
            </div>

            <div>
              <FieldLabel hint="Projenizi yürüten ekibin veya oluşumun adı.">
                Ekip / Takım Adı
              </FieldLabel>
              <input className={inputCls} value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Örn: İnovasyon Takımı, Studio X" />
            </div>

            <div>
              <FieldLabel hint="Ekip üyelerinin adı, rolü ve iletişim bilgileri.">
                Ekip Bilgileri
              </FieldLabel>
              <textarea className={textareaCls} rows={3} value={teamInfo} onChange={(e) => setTeamInfo(e.target.value)} placeholder="Ad Soyad — Rol — iletişim@email.com" />
            </div>

            <div>
              <FieldLabel hint="Projenizi daha önce hiç duymamış birine 30 saniyede anlatacak olsanız ne söylerdiniz?">
                30 Saniyelik Proje Özeti
              </FieldLabel>
              <div className="relative">
                <textarea
                  className={textareaCls}
                  rows={4}
                  value={summary}
                  onChange={(e) => e.target.value.length <= 1500 && setSummary(e.target.value)}
                  placeholder="Projenizi kısaca özetleyiniz…"
                />
                <span className={`absolute bottom-2.5 right-3.5 text-[11px] tabular-nums ${summary.length >= 1400 ? "text-amber-500" : "text-[#aeaeb2]"}`}>
                  {summary.length}/1500
                </span>
              </div>
            </div>

            <div>
              <FieldLabel hint="Bu projeden doğrudan etkilenecek, kullanacak veya fayda sağlayacak ana kitle kimdir?">
                Hedef Kitle
              </FieldLabel>
              <div className="relative">
                <textarea
                  className={textareaCls}
                  rows={3}
                  value={targetAudience}
                  onChange={(e) => e.target.value.length <= 1500 && setTargetAudience(e.target.value)}
                  placeholder="Hedef kitlenizi tanımlayınız…"
                />
                <span className={`absolute bottom-2.5 right-3.5 text-[11px] tabular-nums ${targetAudience.length >= 1400 ? "text-amber-500" : "text-[#aeaeb2]"}`}>
                  {targetAudience.length}/1500
                </span>
              </div>
            </div>

            <div>
              <FieldLabel hint="Projenizin ilgili alanlarını en fazla 2 adet olmak üzere seçiniz.">
                Proje Alanı
              </FieldLabel>
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

            {categories.includes("Teknoloji/Girişimcilik") && (
              <StageSelector
                label="Teknoloji/Girişimcilik — Proje Aşaması"
                options={STAGES["Teknoloji/Girişimcilik"]}
                value={technologyStage}
                onChange={setTechnologyStage}
              />
            )}
            {categories.includes("Sanat/Kültürel/İçerik") && (
              <StageSelector
                label="Sanat/Kültürel/İçerik — Proje Aşaması"
                options={STAGES["Sanat/Kültürel/İçerik"]}
                value={artStage}
                onChange={setArtStage}
              />
            )}
            {categories.includes("Araştırma/Akademik") && (
              <StageSelector
                label="Araştırma/Akademik — Proje Aşaması"
                options={STAGES["Araştırma/Akademik"]}
                value={researchStage}
                onChange={setResearchStage}
              />
            )}

            {error && <ErrorBox message={error} />}
            <NavButtons onBack={goBack} onNext={handleStep1} />
          </div>
        )}

        {/* ── ADIM 2: Problem & Çözüm ──────────────────────────────────────── */}
        {step === 2 && (
          <div className="p-5 sm:p-6 space-y-4">
            <SectionTitle>Problem & Çözüm</SectionTitle>

            <div>
              <FieldLabel hint="Projeniz hangi somut sorunu çözmeyi, hangi ihtiyacı karşılamayı veya hangi fırsatı değerlendirmeyi hedefliyor?">
                Problem / İhtiyaç Tanımı
              </FieldLabel>
              <textarea className={textareaCls} rows={5} value={problemStatement} onChange={(e) => setProblemStatement(e.target.value)} placeholder="Problemi ve hedef kitlenizin mevcut durumunu açıklayınız…" />
            </div>

            <div>
              <FieldLabel hint="Tanımladığınız fırsata/soruna/ihtiyaca yönelik ne tür bir çözüm, ürün, eser, hizmet veya içerik sunuyorsunuz?">
                Çözüm / Ürün / Hizmet
              </FieldLabel>
              <textarea className={textareaCls} rows={5} value={solution} onChange={(e) => setSolution(e.target.value)} placeholder="Teknik, sanatsal veya metodolojik yaklaşımınızı detaylandırınız…" />
            </div>

            <div>
              <FieldLabel hint="Projenizi mevcut benzerlerinden veya bilinen yöntemlerden ayıran temel yenilikler nelerdir?">
                Yenilik / Özgünlük
              </FieldLabel>
              <textarea className={textareaCls} rows={4} value={innovation} onChange={(e) => setInnovation(e.target.value)} placeholder="Alanınıza özgün katkınızı belirtiniz…" />
            </div>

            {error && <ErrorBox message={error} />}
            <NavButtons onBack={goBack} onNext={handleStep2} />
          </div>
        )}

        {/* ── ADIM 3: Plan & Hedefler ──────────────────────────────────────── */}
        {step === 3 && (
          <div className="p-5 sm:p-6 space-y-4">
            <SectionTitle>Plan & Hedefler</SectionTitle>

            <div>
              <FieldLabel hint="Destek sürecinin sonunda elde etmeyi planladığınız somut ve ölçülebilir çıktılar nelerdir?">
                Somut Çıktılar
              </FieldLabel>
              <textarea className={textareaCls} rows={4} value={outputs} onChange={(e) => setOutputs(e.target.value)} placeholder="Beklenen çıktılarınızı listeleyin…" />
            </div>

            <div>
              <FieldLabel hint="Zaman çizelgenizi veya Google Sheets bağlantısını girebilirsiniz.">
                Zaman Çizelgesi
              </FieldLabel>
              <input className={inputCls} value={timeline} onChange={(e) => setTimeline(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/... veya kısa açıklama" />
            </div>

            <div>
              <FieldLabel hint="Projenizin başarılı sayılabilmesi için destek süreci sonunda ulaşmayı hedeflediğiniz somut ve ölçülebilir hedefler.">
                Başarı Kriterleri
              </FieldLabel>
              <textarea className={textareaCls} rows={4} value={successCriteria} onChange={(e) => setSuccessCriteria(e.target.value)} placeholder="Örn: Uygulamanın 1.000 indirmeye ulaşması…" />
            </div>

            {error && <ErrorBox message={error} />}
            <NavButtons onBack={goBack} onNext={handleStep3} />
          </div>
        )}

        {/* ── ADIM 4: Ekosistem & Topluluk ─────────────────────────────────── */}
        {step === 4 && (
          <div className="p-5 sm:p-6 space-y-4">
            <SectionTitle>Ekosistem & Topluluk</SectionTitle>

            <div>
              <FieldLabel hint="Projenizi geliştirirken Divizyon ekosistemiyle nasıl bir işbirliği kurmayı planlıyorsunuz?">
                Ekosistem İşbirliği Planı
              </FieldLabel>
              <textarea className={textareaCls} rows={4} value={ecosystemCollaboration} onChange={(e) => setEcosystemCollaboration(e.target.value)} placeholder="İşbirliği planınızı açıklayınız…" />
            </div>

            <div>
              <FieldLabel hint="Projenizin çıktıları, Divizyon topluluğuna ne gibi bir fayda sağlayacak?">
                Topluluk Katkısı
              </FieldLabel>
              <textarea className={textareaCls} rows={4} value={communityContribution} onChange={(e) => setCommunityContribution(e.target.value)} placeholder="Bilgi paylaşımı, atölye, ortak öğrenme vb. katkılarınız…" />
            </div>

            <div>
              <FieldLabel hint="Projenizin başarısı, Divizyon'un kurumsal itibarına ne şekilde katkı sağlayabilir?">
                Divizyon&apos;a Katkı
              </FieldLabel>
              <textarea className={textareaCls} rows={4} value={divisionContribution} onChange={(e) => setDivisionContribution(e.target.value)} placeholder="Divizyon'a sağlayacağınız katkıyı açıklayınız…" />
            </div>

            {error && <ErrorBox message={error} />}
            <NavButtons onBack={goBack} onNext={handleStep4} />
          </div>
        )}

        {/* ── ADIM 5: Destek & Kaydet ──────────────────────────────────────── */}
        {step === 5 && (
          <div className="divide-y divide-black/[0.05]">

            <div className="p-5 sm:p-6 space-y-3">
              <SectionTitle>İhtiyaç Duyulan Destek Türleri</SectionTitle>
              <p className="text-[12px] text-[#6e6e73]">İhtiyaç duyduğunuz destekleri seçin ve her biri için neden istediğinizi belirtin.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUPPORT_TYPES.map((type) => {
                  const selected = supportTypes.includes(type)
                  return (
                    <div
                      key={type}
                      className={`rounded-xl border transition-all ${selected ? "border-[#1c1c1c]/10 bg-[#fafafa]" : "border-transparent hover:bg-[#f5f5f5]"}`}
                    >
                      <div
                        onClick={() => toggleSupportType(type)}
                        className="flex items-center gap-3 p-3 cursor-pointer"
                      >
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                          selected ? "bg-[#1c1c1c] border-[#1c1c1c]" : "border-[#d1d1d6]"
                        }`}>
                          {selected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className={`text-[13px] leading-snug ${selected ? "text-[#1c1c1c] font-medium" : "text-[#6e6e73]"}`}>{type}</span>
                      </div>
                      {selected && (
                        <div className="px-3 pb-3 pl-11">
                          <textarea
                            value={supportNotes[type] ?? ""}
                            onChange={(e) => updateSupportNote(type, e.target.value)}
                            placeholder="Bu desteğe neden ihtiyaç duyuyorsunuz?"
                            rows={2}
                            className="w-full px-3 py-2 bg-white border border-black/[0.06] rounded-lg text-[12px] text-[#1c1c1c] placeholder:text-[#c7c7cc] resize-none focus:outline-none focus:ring-1 focus:ring-[#fab758]/40 transition-all"
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="px-5 sm:px-6 py-4 bg-[#fafafa]">
              {error && <div className="mb-4"><ErrorBox message={error} /></div>}
              <div className="flex items-center justify-between">
                <button
                  onClick={goBack}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-[#6e6e73] text-[13px] font-medium rounded-xl hover:bg-[#ebebeb] transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Geri
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1c1c1c] text-white text-[13px] font-semibold rounded-xl shadow-sm hover:bg-[#383838] hover:shadow disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {saving ? "Kaydediliyor…" : <><Save className="w-3.5 h-3.5" /> Değişiklikleri Kaydet</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

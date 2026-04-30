"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FileUploader } from "./FileUploader"
import { PROTOCOL_IP, PROTOCOL_SUPPORT } from "@/lib/protocols"
import { Check, ChevronRight, ChevronLeft, Send, AlertCircle } from "lucide-react"

// ── Sabitler ─────────────────────────────────────────────────────────────────

type Period  = { id: string; title: string; endDate: Date }
type Program = { id: string; title: string; endDate: Date }

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

type UploadedFile = { id: string; name: string; size: number; mimeType: string }

const STEPS = [
  { label: "Kişisel Bilgiler",  short: "Kişisel"   },
  { label: "Proje Kimliği",     short: "Kimlik"     },
  { label: "Problem & Çözüm",   short: "Problem"    },
  { label: "Plan & Hedefler",   short: "Plan"       },
  { label: "Ekosistem",         short: "Ekosistem"  },
  { label: "Destek & Gönder",   short: "Gönder"     },
]

const EDUCATION_OPTIONS = [
  "Lise Öğrencisi",
  "Lise Mezunu",
  "Ön Lisans Öğrencisi",
  "Ön Lisans Mezunu",
  "Lisans Öğrencisi",
  "Lisans Mezunu",
  "Yüksek Lisans Öğrencisi",
  "Yüksek Lisans Mezunu",
  "Doktora Öğrencisi / Mezunu",
]

const PROJECT_FIELDS = [
  "Yazılım ve Teknoloji Geliştirme (uygulama, web platformu, oyun, yapay zekâ vb.)",
  "Dijital Sanatlar ve Tasarım (grafik tasarım, animasyon, illüstrasyon, görsel prodüksiyon vb.)",
  "İçerik Üretimi ve Yayıncılık (podcast, video, blog, sosyal medya içerikleri vb.)",
  "Kültürel ve Sanatsal Projeler (sergi, performans, dijital enstalasyon vb.)",
  "Araştırma ve Akademik Katkı (kaynak, rapor, analiz, metodoloji geliştirme vb.)",
  "Girişimcilik ve İş Modeli Geliştirme (ürünleştirme, pazar validasyonu, iş modeli inovasyonu vb.)",
  "Topluluk ve Sosyal Katkı (peer-learning, sosyal etki, kolektif fayda odaklı projeler)",
  "Glokal İşbirliği ve Dış Temsil (uluslararası bağlantılar, bölgesel işbirlikleri, vitrin projeler vb.)",
  "Diğer",
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


// ── Yardımcı bileşenler ───────────────────────────────────────────────────────

const inputCls = "w-full px-3.5 py-2.5 bg-[#f5f5f5] border border-transparent rounded-xl text-[14px] text-[#1c1c1c] placeholder:text-[#c7c7cc] focus:outline-none focus:ring-2 focus:ring-[#fab758]/50 focus:bg-white focus:border-[#fab758]/30 transition-all"
const textareaCls = `${inputCls} resize-none leading-relaxed`

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

function NavButtons({
  onBack, onNext, onSaveDraft, nextLabel = "Devam", loading, savingDraft, disabled,
}: {
  onBack?: () => void
  onNext: () => void
  onSaveDraft?: () => void
  nextLabel?: string
  loading?: boolean
  savingDraft?: boolean
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between pt-2">
      {onBack ? (
        <button onClick={onBack} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-[#6e6e73] text-[13px] font-medium rounded-xl hover:bg-[#ebebeb] transition-colors cursor-pointer">
          <ChevronLeft className="w-4 h-4" /> Geri
        </button>
      ) : <div />}
      <div className="flex items-center gap-2">
        {onSaveDraft && (
          <button
            onClick={onSaveDraft}
            disabled={savingDraft || loading}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-[#6e6e73] text-[13px] font-medium border border-black/[0.08] rounded-xl hover:bg-[#f5f5f5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {savingDraft ? "Kaydediliyor…" : "Taslak Olarak Kaydet"}
          </button>
        )}
        <button
          onClick={onNext}
          disabled={loading || disabled || savingDraft}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#212121] text-white text-[13px] font-semibold rounded-xl shadow-sm hover:bg-[#383838] hover:shadow disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {loading ? "Kaydediliyor…" : <><span>{nextLabel}</span><ChevronRight className="w-4 h-4" /></>}
        </button>
      </div>
    </div>
  )
}

// ── Ana bileşen ───────────────────────────────────────────────────────────────

type ExistingApplication = {
  id:                     string
  periodId?:              string | null
  programId?:             string | null
  title:                  string
  teamName:               string | null
  teamInfo:               string | null
  summary:                string | null
  targetAudience:         string | null
  projectFields:          string[]
  categories:             string[]
  technologyStage:        string | null
  artStage:               string | null
  researchStage:          string | null
  problemStatement:       string | null
  solution:               string | null
  innovation:             string | null
  outputs:                string | null
  timeline:               string | null
  successCriteria:        string | null
  ecosystemCollaboration: string | null
  communityContribution:  string | null
  divisionContribution:   string | null
  supportTypes:           string[]
  supportNotes?:          Record<string, string> | null
  files:                  UploadedFile[]
}

export function ApplicationForm({
  periods, programs, userProfile, existingApplication,
}: {
  periods: Period[]
  programs: Program[]
  userProfile: UserProfile | null
  existingApplication?: ExistingApplication | null
}) {
  const router = useRouter()
  const ea = existingApplication

  // Adım
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Adım 0: Kişisel bilgiler
  const [name,               setName]               = useState(userProfile?.name               ?? "")
  const [phone,              setPhone]              = useState(userProfile?.phone              ?? "")
  const [educationStatus,    setEducationStatus]    = useState(userProfile?.educationStatus    ?? "")
  const [department,         setDepartment]         = useState(userProfile?.department         ?? "")
  const [address,            setAddress]            = useState(userProfile?.address            ?? "")
  const [communityProfileUrl,setCommunityProfileUrl]= useState(userProfile?.communityProfileUrl ?? "")
  const [linkedinUrl,        setLinkedinUrl]        = useState(userProfile?.linkedinUrl        ?? "")
  const [twitterUrl,         setTwitterUrl]         = useState(userProfile?.twitterUrl         ?? "")

  // Adım 1: Proje kimliği
  const [applicationType, setApplicationType] = useState<"period" | "program">(
    ea?.programId ? "program" : "period"
  )
  const [periodId,  setPeriodId]  = useState(ea?.periodId  ?? periods[0]?.id  ?? "")
  const [programId, setProgramId] = useState(ea?.programId ?? programs[0]?.id ?? "")
  const [title,         setTitle]         = useState(ea?.title            ?? "")
  const [teamName,      setTeamName]      = useState((ea as any)?.teamName ?? "")
  const [teamInfo,      setTeamInfo]      = useState(ea?.teamInfo         ?? "")
  const [summary,       setSummary]       = useState(ea?.summary          ?? "")
  const [targetAudience,setTargetAudience]= useState(ea?.targetAudience   ?? "")
  const [projectFields, setProjectFields] = useState<string[]>(ea?.projectFields ?? [])
  const [categories,    setCategories]    = useState<string[]>(ea?.categories ?? [])
  const [technologyStage, setTechnologyStage] = useState(ea?.technologyStage ?? "")
  const [artStage,        setArtStage]        = useState(ea?.artStage        ?? "")
  const [researchStage,   setResearchStage]   = useState(ea?.researchStage   ?? "")

  // Adım 2: Problem & çözüm
  const [problemStatement, setProblemStatement] = useState(ea?.problemStatement ?? "")
  const [solution,         setSolution]         = useState(ea?.solution         ?? "")
  const [innovation,       setInnovation]       = useState(ea?.innovation       ?? "")

  // Adım 3: Plan & hedefler
  const [outputs,         setOutputs]         = useState(ea?.outputs         ?? "")
  const [timeline,        setTimeline]        = useState(ea?.timeline        ?? "")
  const [successCriteria, setSuccessCriteria] = useState(ea?.successCriteria ?? "")

  // Adım 4: Ekosistem
  const [ecosystemCollaboration, setEcosystemCollaboration] = useState(ea?.ecosystemCollaboration ?? "")
  const [communityContribution,  setCommunityContribution]  = useState(ea?.communityContribution  ?? "")
  const [divisionContribution,   setDivisionContribution]   = useState(ea?.divisionContribution   ?? "")

  // Adım 5: Destek & gönder
  const [supportTypes,       setSupportTypes]       = useState<string[]>(ea?.supportTypes ?? [])
  const [supportNotes,       setSupportNotes]       = useState<Record<string, string>>((ea as any)?.supportNotes ?? {})
  const [applicationId,      setApplicationId]      = useState<string | null>(ea?.id ?? null)
  const [files,              setFiles]              = useState<UploadedFile[]>(ea?.files ?? [])
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [acceptIP, setAcceptIP] = useState(false)
  const [protocolModal, setProtocolModal] = useState<"terms" | "ip" | null>(null)

  // ── Yardımcılar ────────────────────────────────────────────────────────────

  function toggleProjectField(field: string) {
    setProjectFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : prev.length < 2 ? [...prev, field] : prev
    )
  }

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

  const selectedPeriod  = periods.find((p) => p.id === periodId)
  const selectedProgram = programs.find((p) => p.id === programId)
  const selectedItem    = applicationType === "period" ? selectedPeriod : selectedProgram
  const daysLeft = selectedItem
    ? Math.max(0, Math.ceil((new Date(selectedItem.endDate).getTime() - Date.now()) / 86_400_000))
    : 0
  const fmt = (d: Date) =>
    new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })

  // ── Taslak kaydetme (sunucuya) ──────────────────────────────────────────────

  const [savingDraft, setSavingDraft] = useState(false)

  async function saveDraft() {
    setError("")
    setSavingDraft(true)
    try {
      // 1. Profil bilgilerini kaydet
      const profileRes = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, educationStatus, department, address, communityProfileUrl, linkedinUrl, twitterUrl }),
      })
      if (!profileRes.ok) { const d = await profileRes.json(); setError(d.error ?? "Profil kaydedilemedi."); return }

      // 2. Minimum gerekli alanlar (title + periodId) varsa başvuruyu oluştur/güncelle
      if (!title.trim()) {
        router.push("/dashboard/applications")
        return // Profil kaydedildi ama başvuru oluşturmak için en azından proje adı lazım
      }

      const appFields = {
        ...(applicationType === "period" ? { periodId } : { programId }),
        title, teamName, teamInfo, summary, targetAudience, projectFields, categories,
        technologyStage, artStage, researchStage,
        problemStatement, solution, innovation,
        outputs, timeline, successCriteria,
        ecosystemCollaboration, communityContribution, divisionContribution,
        supportTypes,
        supportNotes,
      }

      if (!applicationId) {
        const res = await fetch("/api/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(appFields),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? "Hata."); return }
        setApplicationId(data.id)
      } else {
        const res = await fetch(`/api/applications/${applicationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(appFields),
        })
        if (!res.ok) { const d = await res.json(); setError(d.error ?? "Hata."); return }
      }

      router.push("/dashboard/applications")
    } catch { setError("Beklenmedik hata.") }
    finally { setSavingDraft(false) }
  }

  // ── Adım işleyicileri (yalnızca validasyon + ilerleme, API çağrısı yok) ────

  function handleStep0() {
    setError("")
    if (!name.trim())               return setError("Adınız ve soyadınız zorunludur.")
    if (!phone.trim())              return setError("Telefon numarası zorunludur.")
    if (!educationStatus)           return setError("Öğrenim durumunuzu seçiniz.")
    if (!department.trim())         return setError("Bölüm/alan bilgisi zorunludur.")
    if (!address.trim())            return setError("Adres zorunludur.")
    if (!communityProfileUrl.trim()) return setError("Divizyon profil linki zorunludur.")
    setStep(1)
  }

  function handleStep1() {
    setError("")
    if (applicationType === "period"  && periods.length  === 0) return setError("Şu anda aktif bir başvuru dönemi bulunmuyor. Lütfen aktif dönem açılana kadar bekleyiniz.")
    if (applicationType === "program" && programs.length === 0) return setError("Şu anda aktif bir program bulunmuyor. Lütfen aktif program açılana kadar bekleyiniz.")
    if (!title.trim())               return setError("Proje adı zorunludur.")
    if (!summary.trim())             return setError("30 saniyelik özet zorunludur.")
    if (!targetAudience.trim())      return setError("Hedef kitle zorunludur.")
    if (projectFields.length === 0)  return setError("En az bir faaliyet alanı seçiniz.")
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

  async function handleStep4() {
    setError("")
    if (!ecosystemCollaboration.trim()) return setError("Ekosistem işbirliği planı zorunludur.")
    if (!communityContribution.trim())  return setError("Topluluk katkısı zorunludur.")
    if (!divisionContribution.trim())   return setError("Divizyon katkısı zorunludur.")

    // Step 5'te FileUploader için applicationId gerekiyor — yoksa şimdi oluştur
    if (!applicationId) {
      if (!title.trim()) return setError("Dosya yüklemek için önce proje adını giriniz.")
      setLoading(true)
      try {
        // Profil kaydet
        await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, phone, educationStatus, department, address, communityProfileUrl, linkedinUrl, twitterUrl }),
        })
        // Başvuru oluştur
        const res = await fetch("/api/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(applicationType === "period" ? { periodId } : { programId }),
            title, teamName, teamInfo, summary, targetAudience, projectFields, categories,
            technologyStage, artStage, researchStage,
            problemStatement, solution, innovation,
            outputs, timeline, successCriteria,
            ecosystemCollaboration, communityContribution, divisionContribution,
            supportTypes,
          }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? "Hata."); return }
        setApplicationId(data.id)
      } catch { setError("Beklenmedik hata."); return }
      finally { setLoading(false) }
    }
    setStep(5)
  }

  async function handleStep5() {
    setError("")
    if (supportTypes.length === 0) return setError("En az bir destek türü seçiniz.")
    if (files.length === 0)         return setError("En az bir belge yüklenmelidir.")
    if (!acceptTerms || !acceptIP)  return setError("Her iki beyanı da onaylamanız gerekiyor.")

    // Son adımda tüm veriyi kaydet + gönder
    setLoading(true)
    try {
      // Profil kaydet
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, educationStatus, department, address, communityProfileUrl, linkedinUrl, twitterUrl }),
      })

      const appFields = {
        ...(applicationType === "period" ? { periodId } : { programId }),
        title, teamName, teamInfo, summary, targetAudience, projectFields, categories,
        technologyStage, artStage, researchStage,
        problemStatement, solution, innovation,
        outputs, timeline, successCriteria,
        ecosystemCollaboration, communityContribution, divisionContribution,
        supportTypes,
        supportNotes,
      }

      if (!applicationId) {
        const res = await fetch("/api/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(appFields),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? "Hata."); return }
        setApplicationId(data.id)
        // Submit
        const submitRes = await fetch(`/api/applications/${data.id}/submit`, { method: "POST" })
        const submitData = await submitRes.json()
        if (!submitRes.ok) { setError(submitData.error ?? "Hata."); return }
      } else {
        const patchRes = await fetch(`/api/applications/${applicationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(appFields),
        })
        if (!patchRes.ok) { const d = await patchRes.json(); setError(d.error ?? "Hata."); return }
        const submitRes = await fetch(`/api/applications/${applicationId}/submit`, { method: "POST" })
        const data = await submitRes.json()
        if (!submitRes.ok) { setError(data.error ?? "Hata."); return }
      }

      router.push("/dashboard/applications?submitted=1")
    } catch { setError("Beklenmedik hata.") }
    finally { setLoading(false) }
  }

  function goBack() {
    setError("")
    setStep((s) => s - 1)
  }

  // ── Render ──────────────────────────────────────────────────────────────────

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
                i < step  ? "bg-[#212121] border-[#212121] text-white"
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

        {/* ── ADIM 0: Kişisel Bilgiler ───────────────────────────────────── */}
        {step === 0 && (
          <div className="p-5 sm:p-6 space-y-4">
            <SectionTitle>Kişisel Bilgiler</SectionTitle>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Adın Soyadın <Req /></FieldLabel>
                <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ad Soyad" />
              </div>
              <div>
                <FieldLabel>Telefon Numaran <Req /></FieldLabel>
                <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+90 5xx xxx xx xx" />
              </div>
            </div>

            <div>
              <FieldLabel>Öğrenim Durumun <Req /></FieldLabel>
              <SelectField value={educationStatus} onChange={setEducationStatus} options={EDUCATION_OPTIONS} placeholder="Seçiniz" />
            </div>

            <div>
              <FieldLabel>Mezun Olduğun / Öğrencisi Olduğun Bölüm <Req /></FieldLabel>
              <input className={inputCls} value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Örn: Bilgisayar Mühendisliği" />
            </div>

            <div>
              <FieldLabel>Adresin <Req /></FieldLabel>
              <input className={inputCls} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="İlçe, Şehir" />
            </div>

            <div>
              <FieldLabel>E-Posta Adresin</FieldLabel>
              <input className={`${inputCls} opacity-60`} value={userProfile?.email ?? ""} readOnly />
            </div>

            <div>
              <FieldLabel>Divizyon | Komünite Profil Linkin <Req /></FieldLabel>
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
            <NavButtons onNext={handleStep0} onSaveDraft={saveDraft} savingDraft={savingDraft} />
          </div>
        )}

        {/* ── ADIM 1: Proje Kimliği ────────────────────────────────────────── */}
        {step === 1 && (
          <div className="p-5 sm:p-6 space-y-4">
            <SectionTitle>Proje Kimliği</SectionTitle>

            {/* Başvuru Türü: Dönem / Program */}
            <div>
              <FieldLabel>Başvuru Türü <Req /></FieldLabel>
              <div className="flex gap-2">
                {(["period", "program"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setApplicationType(type)}
                    className={`px-4 py-2 rounded-xl text-[13px] font-semibold border transition-all cursor-pointer ${
                      applicationType === type
                        ? "bg-[#212121] text-white border-[#212121]"
                        : "bg-[#f5f5f5] text-[#6e6e73] border-transparent hover:border-[#d1d1d6]"
                    }`}
                  >
                    {type === "period" ? "Dönem" : "Program"}
                  </button>
                ))}
              </div>
            </div>

            {/* Dönem / Program seçici */}
            {applicationType === "period" ? (
              periods.length === 0 ? (
                <ErrorBox message="Şu anda aktif bir başvuru dönemi bulunmuyor. Lütfen aktif dönem açılana kadar bekleyiniz." />
              ) : (
                <div>
                  <FieldLabel>Başvuru Dönemi <Req /></FieldLabel>
                  <SelectField
                    value={periodId}
                    onChange={setPeriodId}
                    options={periods.map((p) => p.title)}
                    values={periods.map((p) => p.id)}
                  />
                  {daysLeft > 0 && selectedPeriod && (
                    <p className="text-[11px] text-amber-600 font-medium mt-1">
                      {daysLeft} gün kaldı · Bitiş: {fmt(selectedPeriod.endDate)}
                    </p>
                  )}
                </div>
              )
            ) : (
              programs.length === 0 ? (
                <ErrorBox message="Şu anda aktif bir program bulunmuyor. Lütfen aktif program açılana kadar bekleyiniz." />
              ) : (
                <div>
                  <FieldLabel>Program <Req /></FieldLabel>
                  <SelectField
                    value={programId}
                    onChange={setProgramId}
                    options={programs.map((p) => p.title)}
                    values={programs.map((p) => p.id)}
                  />
                  {daysLeft > 0 && selectedProgram && (
                    <p className="text-[11px] text-amber-600 font-medium mt-1">
                      {daysLeft} gün kaldı · Bitiş: {fmt(selectedProgram.endDate)}
                    </p>
                  )}
                </div>
              )
            )}

            {/* Proje Adı */}
            <div>
              <FieldLabel
                hint="Projenizi en iyi tanımlayan, akılda kalıcı ve net bir isim belirtiniz."
              >
                Proje Adı <Req />
              </FieldLabel>
              <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Projenizin adı" />
            </div>

            {/* Ekip Adı */}
            <div>
              <FieldLabel hint="Projenizi yürüten ekibin veya oluşumun adı.">
                Ekip / Takım Adı
              </FieldLabel>
              <input className={inputCls} value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Örn: İnovasyon Takımı, Studio X" />
            </div>

            {/* Ekip Bilgileri */}
            <div>
              <FieldLabel hint="Ekip üyelerinin adı, rolü ve iletişim bilgileri.">
                Ekip Bilgileri
              </FieldLabel>
              <textarea className={textareaCls} rows={3} value={teamInfo} onChange={(e) => setTeamInfo(e.target.value)} placeholder="Ad Soyad — Rol — iletişim@email.com" />
            </div>

            {/* 30 saniyelik özet */}
            <div>
              <FieldLabel hint="Projenizi daha önce hiç duymamış birine 30 saniyede anlatacak olsanız ne söylerdiniz? Projenin ne olduğunu, hangi sorunu çözdüğünü ve temel amacını maksimum 1500 karakter ile özetleyiniz.">
                30 Saniyelik Proje Özeti <Req />
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

            {/* Hedef Kitle */}
            <div>
              <FieldLabel hint="Bu projeden doğrudan etkilenecek, kullanacak veya fayda sağlayacak ana kitle kimdir?">
                Hedef Kitle <Req />
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

            {/* Faaliyet Alanı */}
            <div>
              <FieldLabel hint="Projenizin ilgili faaliyet alanlarını en fazla 2 adet olmak üzere işaretleyiniz.">
                Proje Faaliyet Alanı <Req />
              </FieldLabel>
              <div className="flex flex-col gap-2">
                {PROJECT_FIELDS.map((field) => (
                  <label key={field} className="flex items-center gap-3 cursor-pointer group">
                    <div
                      onClick={() => toggleProjectField(field)}
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                        projectFields.includes(field)
                          ? "bg-[#212121] border-[#212121]"
                          : projectFields.length >= 2
                          ? "border-[#e0e0e0] opacity-40 cursor-not-allowed"
                          : "border-[#d1d1d6] group-hover:border-[#aeaeb2]"
                      }`}
                    >
                      {projectFields.includes(field) && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-[13px] text-[#1c1c1c]">{field}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Proje Alanı */}
            <div>
              <FieldLabel hint="Projenizin ilgili alanlarını en fazla 2 adet olmak üzere seçiniz.">
                Proje Alanı <Req />
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

            {/* Aşama matrisleri (seçilen kategoriler için) */}
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
            <NavButtons onBack={goBack} onNext={handleStep1} onSaveDraft={saveDraft} savingDraft={savingDraft} />
          </div>
        )}

        {/* ── ADIM 2: Problem & Çözüm ─────────────────────────────────────── */}
        {step === 2 && (
          <div className="p-5 sm:p-6 space-y-4">
            <SectionTitle>Problem & Çözüm</SectionTitle>

            <div>
              <FieldLabel hint="Projeniz hangi somut sorunu çözmeyi, hangi ihtiyacı karşılamayı veya hangi fırsatı değerlendirmeyi hedefliyor?">
                Problem / İhtiyaç Tanımı <Req />
              </FieldLabel>
              <textarea className={textareaCls} rows={5} value={problemStatement} onChange={(e) => setProblemStatement(e.target.value)} placeholder="Problemi ve hedef kitlenizin mevcut durumunu açıklayınız…" />
            </div>

            <div>
              <FieldLabel hint="Tanımladığınız fırsata/soruna/ihtiyaca yönelik ne tür bir çözüm, ürün, eser, hizmet veya içerik sunuyorsunuz?">
                Çözüm / Ürün / Hizmet <Req />
              </FieldLabel>
              <textarea className={textareaCls} rows={5} value={solution} onChange={(e) => setSolution(e.target.value)} placeholder="Teknik, sanatsal veya metodolojik yaklaşımınızı detaylandırınız…" />
            </div>

            <div>
              <FieldLabel hint="Projenizi mevcut benzerlerinden veya bilinen yöntemlerden ayıran temel yenilikler nelerdir?">
                Yenilik / Özgünlük <Req />
              </FieldLabel>
              <textarea className={textareaCls} rows={4} value={innovation} onChange={(e) => setInnovation(e.target.value)} placeholder="Alanınıza özgün katkınızı belirtiniz…" />
            </div>

            {error && <ErrorBox message={error} />}
            <NavButtons onBack={goBack} onNext={handleStep2} onSaveDraft={saveDraft} savingDraft={savingDraft} />
          </div>
        )}

        {/* ── ADIM 3: Plan & Hedefler ─────────────────────────────────────── */}
        {step === 3 && (
          <div className="p-5 sm:p-6 space-y-4">
            <SectionTitle>Plan & Hedefler</SectionTitle>

            <div>
              <FieldLabel hint="Destek sürecinin sonunda elde etmeyi planladığınız somut ve ölçülebilir çıktılar nelerdir? (ör. çalışan prototip, dijital sanat eseri, araştırma raporu)">
                Somut Çıktılar <Req />
              </FieldLabel>
              <textarea className={textareaCls} rows={4} value={outputs} onChange={(e) => setOutputs(e.target.value)} placeholder="Beklenen çıktılarınızı listeleyin…" />
            </div>

            <div>
              <FieldLabel hint="Projenizin zaman planını Google Sheets şablonunu kullanarak doldurun ve Drive linkini buraya yapıştırın.">
                Zaman Çizelgesi — Drive Linki <Req />
              </FieldLabel>
              <div className="space-y-2">
                <input
                  className={inputCls}
                  type="url"
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                />
                <a
                  href="https://docs.google.com/spreadsheets/d/1gfIcNKRZ8VRE5DNNhky4D6pESoU_Xa6Tda2r7EVugaE/copy"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#fab758] hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                  Örnek Şablonu Kopyala (Google Sheets)
                </a>
              </div>
            </div>

            <div>
              <FieldLabel hint="Projenizin başarılı sayılabilmesi için destek süreci sonunda ulaşmayı hedeflediğiniz somut ve ölçülebilir hedefler nelerdir?">
                Başarı Kriterleri <Req />
              </FieldLabel>
              <textarea className={textareaCls} rows={4} value={successCriteria} onChange={(e) => setSuccessCriteria(e.target.value)} placeholder="Örn: Uygulamanın 1.000 indirmeye ulaşması…" />
            </div>

            {error && <ErrorBox message={error} />}
            <NavButtons onBack={goBack} onNext={handleStep3} onSaveDraft={saveDraft} savingDraft={savingDraft} />
          </div>
        )}

        {/* ── ADIM 4: Ekosistem & Topluluk ────────────────────────────────── */}
        {step === 4 && (
          <div className="p-5 sm:p-6 space-y-4">
            <SectionTitle>Ekosistem & Topluluk</SectionTitle>

            <div>
              <FieldLabel hint="Projenizi geliştirirken Divizyon ekosistemindeki diğer üyelerle, disiplinlerle veya Alliance Partnerleri ile nasıl bir işbirliği kurmayı planlıyorsunuz?">
                Ekosistem İşbirliği Planı <Req />
              </FieldLabel>
              <textarea className={textareaCls} rows={4} value={ecosystemCollaboration} onChange={(e) => setEcosystemCollaboration(e.target.value)} placeholder="İşbirliği planınızı açıklayınız…" />
            </div>

            <div>
              <FieldLabel hint="Projenizin çıktıları veya süreç boyunca edindiğiniz deneyimler, Divizyon topluluğuna ne gibi bir fayda sağlayacak?">
                Topluluk Katkısı <Req />
              </FieldLabel>
              <textarea className={textareaCls} rows={4} value={communityContribution} onChange={(e) => setCommunityContribution(e.target.value)} placeholder="Bilgi paylaşımı, atölye, ortak öğrenme vb. katkılarınız…" />
            </div>

            <div>
              <FieldLabel hint="Projenizin başarısı, Divizyon'un bir açık inovasyon platformu olarak tanınmasına ve kurumsal itibarına ne şekilde katkı sağlayabilir?">
                Divizyon&apos;a Katkı <Req />
              </FieldLabel>
              <textarea className={textareaCls} rows={4} value={divisionContribution} onChange={(e) => setDivisionContribution(e.target.value)} placeholder="Divizyon'a sağlayacağınız katkıyı açıklayınız…" />
            </div>

            {error && <ErrorBox message={error} />}
            <NavButtons onBack={goBack} onNext={handleStep4} onSaveDraft={saveDraft} savingDraft={savingDraft} />
          </div>
        )}

        {/* ── ADIM 5: Destek & Gönder ─────────────────────────────────────── */}
        {step === 5 && (
          <div className="divide-y divide-black/[0.05]">

            {/* Destek türleri */}
            <div className="p-5 sm:p-6 space-y-3">
              <SectionTitle>İhtiyaç Duyulan Destek Türleri</SectionTitle>
              <p className="text-[12px] text-[#6e6e73]">İhtiyaç duyduğunuz destekleri seçin ve her biri için neden istediğinizi belirtin.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUPPORT_TYPES.map((type) => {
                  const selected = supportTypes.includes(type)
                  return (
                    <div key={type} className={`rounded-xl border transition-all ${selected ? "border-[#1c1c1c]/10 bg-[#fafafa]" : "border-transparent hover:bg-[#f5f5f5]"}`}>
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

            {/* Belge yükleme */}
            <div className="p-5 sm:p-6">
              <SectionTitle>Belgeler</SectionTitle>
              <p className="text-[12px] text-[#6e6e73] mb-4">Proje planı, bütçe taslağı, sunum vb. (en az 1 belge zorunlu)</p>
              {applicationId ? (
                <FileUploader applicationId={applicationId} onFilesChange={setFiles} />
              ) : (
                <p className="text-[13px] text-[#aeaeb2]">Dosya yüklemek için önce taslak olarak kaydedin.</p>
              )}
            </div>

            {/* Beyan ve Onay */}
            <div className="p-5 sm:p-6 space-y-4">
              <SectionTitle>Beyan ve Onay</SectionTitle>

              <div
                onClick={() => { if (!acceptTerms) setProtocolModal("terms"); else setAcceptTerms(false) }}
                className="flex items-start gap-3 cursor-pointer group"
              >
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                  acceptTerms ? "bg-[#1c1c1c] border-[#1c1c1c]" : "border-[#d1d1d6] group-hover:border-[#aeaeb2]"
                }`}>
                  {acceptTerms && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-[13px] text-[#1c1c1c] leading-relaxed">
                  <button type="button" onClick={(e) => { e.stopPropagation(); setProtocolModal("terms") }} className="text-[#fab758] underline underline-offset-2 font-medium cursor-pointer">Divizyon Fikri, Sınai ve Mülkiyet Hakları Protokolü</button>&apos;nü okudum, anladım ve burada belirtilen tüm ilke, esas ve yaklaşımları kabul ediyorum. Bu formda verdiğim tüm bilgilerin doğru ve eksiksiz olduğunu beyan ederim.
                </span>
              </div>

              <div
                onClick={() => { if (!acceptIP) setProtocolModal("ip"); else setAcceptIP(false) }}
                className="flex items-start gap-3 cursor-pointer group"
              >
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                  acceptIP ? "bg-[#1c1c1c] border-[#1c1c1c]" : "border-[#d1d1d6] group-hover:border-[#aeaeb2]"
                }`}>
                  {acceptIP && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-[13px] text-[#1c1c1c] leading-relaxed">
                  <button type="button" onClick={(e) => { e.stopPropagation(); setProtocolModal("ip") }} className="text-[#fab758] underline underline-offset-2 font-medium cursor-pointer">Mikro Fonlama ve Ağ Destekleri Protokolü</button>&apos;nü okudum, anladım ve burada belirtilen tüm hak, yükümlülük ve kullanım şartlarını kabul ediyorum. Projemin desteklenmesi durumunda raporlama, görünürlük ve diğer tüm yükümlülükleri yerine getirmeyi taahhüt ederim.
                </span>
              </div>
            </div>

            {/* Protokol Modal */}
            {protocolModal && (
              <ProtocolModal
                type={protocolModal}
                onAccept={() => {
                  if (protocolModal === "terms") setAcceptTerms(true)
                  else setAcceptIP(true)
                  setProtocolModal(null)
                }}
                onClose={() => setProtocolModal(null)}
              />
            )}

            {/* Gönder */}
            <div className="px-5 sm:px-6 py-4 bg-[#fafafa]">
              {error && <div className="mb-4"><ErrorBox message={error} /></div>}
              <div className="flex items-center justify-between">
                <button onClick={goBack} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-[#6e6e73] text-[13px] font-medium rounded-xl hover:bg-[#ebebeb] transition-colors cursor-pointer">
                  <ChevronLeft className="w-4 h-4" /> Geri
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={saveDraft}
                    disabled={savingDraft || loading}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 text-[#6e6e73] text-[13px] font-medium border border-black/[0.08] rounded-xl hover:bg-[#f5f5f5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    {savingDraft ? "Kaydediliyor…" : "Taslak Olarak Kaydet"}
                  </button>
                  <button
                    onClick={handleStep5}
                    disabled={loading || !acceptTerms || !acceptIP || savingDraft}
                    title={(!acceptTerms || !acceptIP) ? "Her iki beyanı da onaylamanız gerekiyor" : undefined}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1c1c1c] text-white text-[13px] font-semibold rounded-xl shadow-sm hover:bg-[#383838] hover:shadow disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    {loading ? "Gönderiliyor…" : <><Send className="w-3.5 h-3.5" /> Başvuruyu Gönder</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Yardımcı alt bileşenler ──────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold text-[#aeaeb2] uppercase tracking-[0.12em] pb-1 border-b border-black/[0.04]">
      {children}
    </p>
  )
}

function Req() {
  return <span className="text-red-400 ml-0.5">*</span>
}

function SelectField({
  value, onChange, options, values, placeholder,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  values?: string[]
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
        {options.map((opt, i) => (
          <option key={opt} value={values ? values[i] : opt}>{opt}</option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#aeaeb2]">
        <svg width="10" height="6" fill="none" viewBox="0 0 10 6">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  )
}

function ProtocolModal({
  type,
  onAccept,
  onClose,
}: {
  type: "terms" | "ip"
  onAccept: () => void
  onClose: () => void
}) {
  const [scrolledToEnd, setScrolledToEnd] = useState(false)

  const title = type === "terms"
    ? "Divizyon | Komünite — Fikri, Sınai ve Mülkiyet Hakları Protokolü"
    : "Mikro Fonlama ve Ağ Destekleri Protokolü"

  const content = type === "terms" ? PROTOCOL_IP : PROTOCOL_SUPPORT

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col mx-4">
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-[#e8e8e8]">
          <p className="text-[15px] font-semibold text-[#1c1c1c]">{title}</p>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#aeaeb2] hover:text-[#1c1c1c] hover:bg-[#f0f0f0] transition-colors cursor-pointer">
            <span className="text-[16px]">✕</span>
          </button>
        </div>

        <div
          className="flex-1 overflow-y-auto px-5 py-4"
          onScroll={(e) => {
            const el = e.currentTarget
            if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) setScrolledToEnd(true)
          }}
        >
          <p className="text-[13px] text-[#1c1c1c] whitespace-pre-wrap leading-relaxed">{content}</p>
        </div>

        <div className="shrink-0 px-5 py-4 border-t border-[#e8e8e8] flex items-center justify-between gap-3">
          {!scrolledToEnd && (
            <p className="text-[11px] text-[#aeaeb2] flex-1">Onaylamak için sonuna kadar okuyun ↓</p>
          )}
          {scrolledToEnd && <div className="flex-1" />}
          <div className="flex items-center gap-2">
            <button onClick={onClose}
              className="px-4 py-2.5 text-[13px] text-[#6e6e73] rounded-xl hover:bg-[#f5f5f5] transition-colors cursor-pointer">
              Kapat
            </button>
            <button
              onClick={onAccept}
              disabled={!scrolledToEnd}
              className="px-5 py-2.5 bg-[#1c1c1c] text-white text-[13px] font-semibold rounded-xl shadow-sm hover:bg-[#383838] disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Okudum ve Onaylıyorum
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function StageSelector({
  label, options, value, onChange,
}: {
  label: string
  options: string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <FieldLabel>{label} <Req /></FieldLabel>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`px-3.5 py-1.5 rounded-xl text-[12px] font-medium border transition-all cursor-pointer ${
              value === opt
                ? "bg-[#212121] text-white border-[#212121]"
                : "bg-[#f5f5f5] text-[#6e6e73] border-transparent hover:bg-[#ebebeb]"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

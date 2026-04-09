"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FileUploader } from "./FileUploader"
import {
  Check, ChevronRight, ChevronLeft, Send,
  Calendar, FileText, AlignLeft, Info, AlertCircle,
} from "lucide-react"

type Period = { id: string; title: string; endDate: Date }

type UploadedFile = {
  id: string
  name: string
  size: number
  mimeType: string
}

const STEPS = [
  { label: "Dönem & Bilgiler", short: "Bilgiler" },
  { label: "Belge Yükleme",    short: "Belgeler" },
  { label: "Gözden Geçir",     short: "Gönder"   },
]

const STEP_HINTS = [
  {
    title: "Proje bilgilerini girin",
    items: [
      "Başvurmak istediğiniz aktif dönemi seçin.",
      "Proje başlığını kısa ve açıklayıcı tutun.",
      "Açıklamada hedef, ekip ve beklenen çıktıları belirtin.",
    ],
  },
  {
    title: "Destekleyici belgeleri yükleyin",
    items: [
      "Proje planı, bütçe taslağı, sunum gibi belgeler.",
      "PDF, Word veya Excel formatında, maks. 10 MB.",
      "En az 1 belge zorunludur.",
    ],
  },
  {
    title: "Gözden geçirin ve gönderin",
    items: [
      "Bilgilerinizin doğruluğunu kontrol edin.",
      "Başvuru protokolünü sonuna kadar okuyun.",
      "Onayladıktan sonra başvurunuz gönderilir.",
    ],
  },
]

const PROTOCOL_TEXT = `MİKRO DESTEK FONU BAŞVURU PROTOKOLÜ

1. Başvuru Koşulları
Bu başvuru, yalnızca Divizyon ekosistemi içerisinde yer alan topluluk üyelerine açıktır. Başvuru sahibi, aktif bir komünite üyesi olduğunu beyan eder.

2. Bilgilerin Doğruluğu
Başvuruda sunulan tüm bilgiler (proje açıklaması, ekip bilgileri, desteklenecek alan vb.) doğru, eksiksiz ve günceldir. Yanıltıcı veya eksik bilgi verilmesi başvurunun iptaline neden olabilir.

3. Değerlendirme Süreci
Başvurular, programa atanan bağımsız jüri üyeleri tarafından belirlenen kriterler (yenilikçilik, etki potansiyeli, uygulanabilirlik, ekip yetkinliği, sürdürülebilirlik) doğrultusunda değerlendirilir. Değerlendirme süreci ve sonuçları gizlidir.

4. Destek Kapsamı
Mikro Destek Fonu, ayni destek temellidir; nakdi ödeme içermez. Desteklerin kapsamı ve türü program yöneticisi tarafından belirlenir.

5. Gizlilik ve Veri Kullanımı
Başvuru kapsamında paylaşılan bilgiler yalnızca değerlendirme süreci için kullanılır. Üçüncü taraflarla paylaşılmaz.

6. Fikri Mülkiyet
Başvuru sahibi, sunduğu proje fikrinin kendisine ait olduğunu ve üçüncü taraf haklarını ihlal etmediğini beyan eder.

7. Protokol Onayı
Bu protokolü onaylayarak başvuru koşullarını okuduğunuzu, anladığınızı ve kabul ettiğinizi beyan etmiş olursunuz. Bu onay sisteme kayıt altına alınır.`

export function ApplicationForm({ periods, userId }: { periods: Period[]; userId: string }) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [hasScrolledProtocol, setHasScrolledProtocol] = useState(false)

  const [periodId, setPeriodId] = useState(periods[0]?.id ?? "")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [applicationId, setApplicationId] = useState<string | null>(null)
  const [files, setFiles] = useState<UploadedFile[]>([])

  async function handleStep1() {
    setError("")
    if (!title.trim() || description.length < 50) {
      setError("Başlık ve en az 50 karakterlik açıklama gereklidir.")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periodId, title, description }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Hata."); return }
      setApplicationId(data.id)
      setStep(1)
    } catch { setError("Beklenmedik hata.") }
    finally { setLoading(false) }
  }

  function handleStep2() {
    if (files.length === 0) { setError("En az bir belge yüklemeniz gerekiyor."); return }
    setError("")
    setStep(2)
  }

  async function handleSubmit() {
    if (!applicationId) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/applications/${applicationId}/submit`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Hata."); return }
      router.push("/dashboard/applications?submitted=1")
    } catch { setError("Beklenmedik hata.") }
    finally { setLoading(false) }
  }

  const selectedPeriod = periods.find((p) => p.id === periodId)
  const daysLeft = selectedPeriod
    ? Math.max(0, Math.ceil((new Date(selectedPeriod.endDate).getTime() - Date.now()) / 86_400_000))
    : 0
  const fmt = (d: Date) =>
    new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })

  const hint = STEP_HINTS[step]

  return (
    <div className="space-y-6">

      {/* Step indicator */}
      <div className="relative">
        {/* Arka plan çizgisi */}
        <div className="absolute left-0 right-0 top-4 h-0.5 bg-[#e5e5e5]" />
        {/* İlerleme çizgisi */}
        <div
          className="absolute left-0 top-4 h-0.5 bg-[#212121] transition-all duration-500 ease-out"
          style={{ width: step === 0 ? "0%" : step === 1 ? "50%" : "100%" }}
        />
        <div className="relative flex items-start justify-between">
          {STEPS.map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-2.5 flex-1 first:items-start last:items-end">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold transition-all duration-200 border-2 ${
                i < step
                  ? "bg-[#212121] border-[#212121] text-white"
                  : i === step
                  ? "bg-white border-[#212121] text-[#212121]"
                  : "bg-white border-[#e0e0e0] text-[#aeaeb2]"
              }`}>
                {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className={`hidden sm:block text-[11px] font-semibold transition-colors ${
                i === step ? "text-[#1c1c1c]" : i < step ? "text-[#6e6e73]" : "text-[#aeaeb2]"
              }`}>
                {s.label}
              </span>
              <span className={`sm:hidden text-[11px] font-semibold transition-colors ${
                i === step ? "text-[#1c1c1c]" : i < step ? "text-[#6e6e73]" : "text-[#aeaeb2]"
              }`}>
                {s.short}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* İki kolon */}
      <div className="grid grid-cols-1 xl:grid-cols-[240px_1fr] gap-4 items-start">

        {/* Sol — bağlam kartı */}
        <div className="hidden xl:block bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] p-5 space-y-4">
          <div className="w-8 h-8 rounded-xl bg-[#fab758]/10 flex items-center justify-center">
            <Info className="w-4 h-4 text-[#fab758]" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#1c1c1c]">{hint.title}</p>
            <ul className="mt-3 space-y-2.5">
              {hint.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-[12px] text-[#6e6e73] leading-snug">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#fab758] mt-1.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="pt-3 border-t border-black/[0.05]">
            <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-widest">
              Adım {step + 1} / {STEPS.length}
            </p>
          </div>
        </div>

        {/* Sağ — form kartı */}
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] overflow-hidden">

          {/* ADIM 1 */}
          {step === 0 && (
            <div className="p-5 sm:p-6 space-y-5">
              <div className="space-y-4">

                {/* Dönem */}
                <div className="space-y-1.5">
                  <label htmlFor="period" className="flex items-center gap-1.5 text-[13px] font-medium text-[#1c1c1c]">
                    <Calendar className="w-3.5 h-3.5 text-[#aeaeb2]" />
                    Başvuru Dönemi
                  </label>
                  <div className="relative">
                    <select
                      id="period"
                      value={periodId}
                      onChange={(e) => setPeriodId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#f5f5f5] border border-transparent rounded-xl text-[14px] text-[#1c1c1c] focus:outline-none focus:ring-2 focus:ring-[#fab758]/50 focus:bg-white focus:border-[#fab758]/30 transition-all appearance-none cursor-pointer"
                    >
                      {periods.map((p) => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#aeaeb2]">
                      <svg width="10" height="6" fill="none" viewBox="0 0 10 6">
                        <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                  {daysLeft > 0 && selectedPeriod && (
                    <p className="text-[11px] text-amber-600 font-medium">
                      {daysLeft} gün kaldı · Bitiş: {fmt(selectedPeriod.endDate)}
                    </p>
                  )}
                </div>

                {/* Başlık */}
                <div className="space-y-1.5">
                  <label htmlFor="title" className="flex items-center gap-1.5 text-[13px] font-medium text-[#1c1c1c]">
                    <FileText className="w-3.5 h-3.5 text-[#aeaeb2]" />
                    Proje Başlığı
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Projenizin kısa ve açıklayıcı başlığı"
                    className="w-full px-3.5 py-2.5 bg-[#f5f5f5] border border-transparent rounded-xl text-[14px] text-[#1c1c1c] placeholder:text-[#c7c7cc] focus:outline-none focus:ring-2 focus:ring-[#fab758]/50 focus:bg-white focus:border-[#fab758]/30 transition-all"
                  />
                </div>

                {/* Açıklama */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="description" className="flex items-center gap-1.5 text-[13px] font-medium text-[#1c1c1c]">
                      <AlignLeft className="w-3.5 h-3.5 text-[#aeaeb2]" />
                      Proje Açıklaması
                    </label>
                    <span className={`text-[11px] font-semibold tabular-nums transition-colors ${
                      description.length >= 50 ? "text-emerald-600" : "text-[#aeaeb2]"
                    }`}>
                      {description.length} / 50+
                    </span>
                  </div>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    placeholder="Projenizi, amacını ve beklenen çıktılarını açıklayın…"
                    className="w-full px-3.5 py-2.5 bg-[#f5f5f5] border border-transparent rounded-xl text-[14px] text-[#1c1c1c] placeholder:text-[#c7c7cc] resize-none focus:outline-none focus:ring-2 focus:ring-[#fab758]/50 focus:bg-white focus:border-[#fab758]/30 transition-all leading-relaxed"
                  />
                </div>
              </div>

              {error && <ErrorBox message={error} />}

              <div className="flex justify-end pt-1">
                <button
                  onClick={handleStep1}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#212121] text-white text-[13px] font-semibold rounded-xl hover:bg-[#2d2d2d] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {loading ? "Kaydediliyor…" : (
                    <><span>Devam</span><ChevronRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ADIM 2 */}
          {step === 1 && applicationId && (
            <div className="p-5 sm:p-6 space-y-5">
              <FileUploader
                applicationId={applicationId}
                onFilesChange={setFiles}
              />

              {error && <ErrorBox message={error} />}

              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => { setStep(0); setError("") }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-[#6e6e73] text-[13px] font-medium rounded-xl hover:bg-[#f0f0f0] transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Geri
                </button>
                <button
                  onClick={handleStep2}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#212121] text-white text-[13px] font-semibold rounded-xl hover:bg-[#2d2d2d] transition-colors cursor-pointer"
                >
                  Devam <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ADIM 3 */}
          {step === 2 && (
            <div className="divide-y divide-black/[0.05]">

              {/* Özet */}
              <div className="p-5 sm:p-6 space-y-4">
                <p className="text-[12px] font-semibold text-[#aeaeb2] uppercase tracking-wider">
                  Başvuru Özeti
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-wider mb-1">Dönem</p>
                    <p className="text-[13px] font-medium text-[#1c1c1c]">{selectedPeriod?.title}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-wider mb-1">Belgeler</p>
                    <p className="text-[13px] font-medium text-[#1c1c1c]">{files.length} dosya</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-wider mb-1">Proje Başlığı</p>
                  <p className="text-[14px] font-semibold text-[#1c1c1c]">{title}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-wider mb-1">Açıklama</p>
                  <p className="text-[13px] text-[#6e6e73] leading-relaxed line-clamp-3">{description}</p>
                </div>
                {files.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-wider mb-2">Yüklenen Belgeler</p>
                    <ul className="space-y-1.5">
                      {files.map((f) => (
                        <li key={f.id} className="flex items-center gap-2 text-[12px] text-[#6e6e73]">
                          <FileText className="w-3.5 h-3.5 text-[#aeaeb2] shrink-0" />
                          {f.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Protokol */}
              <div className="p-5 sm:p-6 space-y-3.5">
                <div>
                  <p className="text-[13px] font-semibold text-[#1c1c1c]">Başvuru Protokolü</p>
                  <p className="text-[12px] text-[#6e6e73] mt-0.5">
                    Göndermek için protokolü sonuna kadar okuyun.
                  </p>
                </div>
                <div
                  className="max-h-48 overflow-y-auto bg-[#f5f5f5] border border-black/[0.06] rounded-xl p-4 text-[12px] text-[#6e6e73] whitespace-pre-wrap leading-relaxed"
                  onScroll={(e) => {
                    const el = e.currentTarget
                    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 5) {
                      setHasScrolledProtocol(true)
                    }
                  }}
                >
                  {PROTOCOL_TEXT}
                </div>
                <div className="flex items-center gap-2.5">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                    hasScrolledProtocol ? "bg-[#212121]" : "border-2 border-[#e0e0e0]"
                  }`}>
                    {hasScrolledProtocol && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <p className={`text-[12px] font-medium transition-colors ${
                    hasScrolledProtocol ? "text-[#1c1c1c]" : "text-[#aeaeb2]"
                  }`}>
                    {hasScrolledProtocol ? "Protokol okundu ✓" : "Protokolü sonuna kadar okuyun"}
                  </p>
                </div>
              </div>

              {/* Aksiyon */}
              <div className="px-5 sm:px-6 py-4 bg-[#fafafa]">
                {error && <div className="mb-4"><ErrorBox message={error} /></div>}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => { setStep(1); setError(""); setHasScrolledProtocol(false) }}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 text-[#6e6e73] text-[13px] font-medium rounded-xl hover:bg-[#ebebeb] transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" /> Geri
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !hasScrolledProtocol}
                    title={!hasScrolledProtocol ? "Önce protokolü sonuna kadar okuyun" : undefined}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#212121] text-white text-[13px] font-semibold rounded-xl hover:bg-[#2d2d2d] disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    {loading ? "Gönderiliyor…" : (
                      <><Send className="w-3.5 h-3.5" /> Başvuruyu Gönder</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
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

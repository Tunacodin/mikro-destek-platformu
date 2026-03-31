"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FileUploader } from "./FileUploader"
import { Check, ChevronRight, ChevronLeft, Send } from "lucide-react"

type Period = { id: string; title: string; endDate: Date }

type UploadedFile = {
  id: string
  name: string
  size: number
  mimeType: string
}

const STEPS = ["Dönem & Bilgiler", "Belge Yükleme", "Gözden Geçir & Gönder"]

export function ApplicationForm({ periods, userId }: { periods: Period[]; userId: string }) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Form verileri
  const [periodId, setPeriodId] = useState(periods[0]?.id ?? "")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [applicationId, setApplicationId] = useState<string | null>(null)
  const [files, setFiles] = useState<UploadedFile[]>([])

  // Adım 1 → 2: Taslak oluştur
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

  // Adım 2 → 3
  function handleStep2() {
    if (files.length === 0) { setError("En az bir belge yüklemeniz gerekiyor."); return }
    setError("")
    setStep(2)
  }

  // Adım 3: Gönder
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

  return (
    <div className="space-y-6">
      {/* Adım göstergesi */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
              i < step ? "bg-green-500 text-white" : i === step ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"
            }`}>
              {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span className={`text-xs hidden sm:block ${i === step ? "font-medium" : "text-muted-foreground"}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="h-px w-6 bg-slate-200 mx-1" />}
          </div>
        ))}
      </div>

      <div className="bg-white border rounded-lg p-6">
        {/* ADIM 1: Bilgiler */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Başvuru Dönemi</label>
              <select
                value={periodId}
                onChange={(e) => setPeriodId(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
              >
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
              {daysLeft > 0 && (
                <p className="text-xs text-amber-600">{daysLeft} gün kaldı</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Proje Başlığı</label>
              <input
                type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="Projenizin kısa ve açıklayıcı başlığı"
                className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">
                Proje Açıklaması
                <span className="text-muted-foreground font-normal ml-1">
                  ({description.length} / en az 50 karakter)
                </span>
              </label>
              <textarea
                value={description} onChange={(e) => setDescription(e.target.value)}
                rows={6} placeholder="Projenizi, amacını ve beklenen çıktılarını açıklayın…"
                className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
              />
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</p>}

            <button onClick={handleStep1} disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-700 disabled:opacity-50 transition-colors">
              {loading ? "Kaydediliyor…" : <><span>İleri</span><ChevronRight className="w-4 h-4" /></>}
            </button>
          </div>
        )}

        {/* ADIM 2: Dosya yükleme */}
        {step === 1 && applicationId && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Proje planı, bütçe tablosu ve destekleyici belgelerinizi yükleyin. (PDF, Word, Excel · maks. 10 MB)
            </p>
            <FileUploader
              applicationId={applicationId}
              onFilesChange={setFiles}
            />

            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</p>}

            <div className="flex gap-3">
              <button onClick={() => { setStep(0); setError("") }}
                className="flex items-center gap-1 px-4 py-2 border text-sm rounded-md hover:bg-slate-50 transition-colors">
                <ChevronLeft className="w-4 h-4" /><span>Geri</span>
              </button>
              <button onClick={handleStep2}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-700 transition-colors">
                <span>İleri</span><ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ADIM 3: Özet + Gönder */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Dönem</p>
                <p className="text-sm font-medium">{selectedPeriod?.title}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Başlık</p>
                <p className="text-sm font-medium">{title}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Açıklama</p>
                <p className="text-sm">{description}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Belgeler</p>
                <ul className="text-sm space-y-0.5 mt-1">
                  {files.map((f) => (
                    <li key={f.id} className="text-slate-700">· {f.name}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800">
              Başvurunuzu gönderdikten sonra düzenleyemezsiniz. Lütfen bilgileri kontrol edin.
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</p>}

            <div className="flex gap-3">
              <button onClick={() => { setStep(1); setError("") }}
                className="flex items-center gap-1 px-4 py-2 border text-sm rounded-md hover:bg-slate-50 transition-colors">
                <ChevronLeft className="w-4 h-4" /><span>Geri</span>
              </button>
              <button onClick={handleSubmit} disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white text-sm font-medium rounded-md hover:bg-green-800 disabled:opacity-50 transition-colors">
                {loading ? "Gönderiliyor…" : <><Send className="w-4 h-4" /><span>Başvuruyu Gönder</span></>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

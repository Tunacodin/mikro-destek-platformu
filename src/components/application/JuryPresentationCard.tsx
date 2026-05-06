"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Presentation,
  Download,
  Upload,
  Trash2,
  FileCheck2,
  AlertCircle,
  Loader2,
  Sparkles,
  Clock,
} from "lucide-react"

const TEMPLATE_URL = "/templates/juri-sunum-sablonu.pptx"
const TEMPLATE_NAME = "Mikro-Destek Juri Sunum Sablonu.pptx"

const MAX_SIZE_MB = 25

type JuryPresentationFile = {
  id: string
  name: string
  size: number
  mimeType: string
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

export function JuryPresentationCard({
  applicationId,
  presentationDate,
  file,
  canEdit,
  variant = "applicant",
}: {
  applicationId: string
  presentationDate: string | null
  file: JuryPresentationFile | null
  canEdit: boolean
  variant?: "applicant" | "viewer" | "admin"
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dueLabel = presentationDate
    ? new Date(presentationDate).toLocaleString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Istanbul",
      })
    : null

  async function handleUpload(picked: File) {
    if (picked.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Dosya boyutu ${MAX_SIZE_MB} MB'ı aşamaz.`)
      return
    }
    setError(null)
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", picked)
      fd.append("applicationId", applicationId)
      fd.append("kind", "jury_presentation")
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Yükleme başarısız.")
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  async function handleDelete() {
    if (!file) return
    if (!confirm("Yüklediğiniz sunumu silmek istediğinize emin misiniz?")) return
    setError(null)
    setDeleting(true)
    try {
      const res = await fetch(`/api/files/${file.id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Silme başarısız.")
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.")
    } finally {
      setDeleting(false)
    }
  }

  const isViewer = variant === "viewer"
  const isAdmin = variant === "admin"
  const isApplicant = !isViewer && !isAdmin

  // Başvuru sahibinde dosya yokken yükseltilmiş tasarım
  const promoteApplicant = isApplicant && !file
  // Admin: viewer gibi sade, yükleme/silme tali aksiyonlar olarak görünsün
  const showAdminActions = isAdmin && canEdit

  return (
    <div
      className={
        promoteApplicant
          ? "relative overflow-hidden rounded-2xl border-2 border-[#fab758]/60 bg-gradient-to-br from-[#fff8eb] via-[#fff3da] to-[#ffe8b8] shadow-[0_8px_30px_rgba(250,183,88,0.18)] p-6 space-y-5"
          : isApplicant
            ? "bg-gradient-to-br from-[#fffaf0] to-white rounded-2xl border border-[#fab758]/40 shadow-[0_2px_12px_rgba(250,183,88,0.08)] p-5 space-y-4"
            : "bg-white rounded-2xl border border-[#fab758]/30 shadow-[0_1px_6px_rgba(0,0,0,0.04)] p-5 space-y-4"
      }
    >
      {/* Dekoratif arka plan glow */}
      {promoteApplicant && (
        <>
          <div className="pointer-events-none absolute -top-12 -right-12 w-44 h-44 rounded-full bg-[#fab758]/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-8 w-36 h-36 rounded-full bg-[#fab758]/20 blur-3xl" />
        </>
      )}

      <div className="relative flex items-start gap-3">
        <div
          className={
            promoteApplicant
              ? "relative w-12 h-12 rounded-2xl bg-gradient-to-br from-[#fab758] to-[#e89a35] flex items-center justify-center shrink-0 shadow-md"
              : "w-9 h-9 rounded-xl bg-[#fab758]/15 flex items-center justify-center shrink-0"
          }
        >
          <Presentation
            className={promoteApplicant ? "w-5 h-5 text-white" : "w-4 h-4 text-[#c98a23]"}
          />
          {promoteApplicant && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#fab758] opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#fab758] border-2 border-white" />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          {promoteApplicant && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#9a6814] bg-[#fab758]/30 px-2 py-0.5 rounded-full mb-1.5 uppercase tracking-wider">
              <Sparkles className="w-2.5 h-2.5" />
              Sıradaki Adım
            </span>
          )}
          <p
            className={
              promoteApplicant
                ? "text-[18px] font-bold text-[#1c1c1c] leading-tight"
                : "text-[14px] font-semibold text-[#1c1c1c]"
            }
          >
            Jüri Sunumu
          </p>
          <p
            className={
              promoteApplicant
                ? "text-[13px] text-[#6e4d18] mt-1 leading-relaxed"
                : "text-[12px] text-[#6e6e73] mt-0.5 leading-relaxed"
            }
          >
            {isViewer || isAdmin
              ? "Başvuru sahibinin jüri sunumu için yüklediği dosya."
              : promoteApplicant
                ? "Aşağıdaki şablonu indirin, doldurun ve jüri sunumunuzdan önce sisteme yükleyin."
                : "Aşağıdaki şablonu indirip doldurun, jüri sunumunuzdan önce buradan yükleyin."}
          </p>
          {dueLabel && (
            <p
              className={
                promoteApplicant
                  ? "text-[12px] text-[#9a6814] mt-2 inline-flex items-center gap-1.5 font-medium"
                  : "text-[11px] text-[#aeaeb2] mt-1"
              }
            >
              {promoteApplicant && <Clock className="w-3 h-3" />}
              Sunum tarihi:{" "}
              <span className={promoteApplicant ? "font-semibold" : "font-medium text-[#6e6e73]"}>
                {dueLabel}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Şablon indirme — sadece başvuru sahibi görür (admin alt satırda görür) */}
      {isApplicant && (
        <a
          href={TEMPLATE_URL}
          download={TEMPLATE_NAME}
          className={
            promoteApplicant
              ? "relative flex items-center justify-between px-4 py-3.5 bg-white hover:bg-white/90 rounded-xl border-2 border-[#fab758]/40 transition-all cursor-pointer group shadow-sm hover:shadow"
              : "flex items-center justify-between px-3.5 py-2.5 bg-[#f9f9f9] hover:bg-[#f1f1f1] rounded-xl border border-black/[0.05] transition-colors cursor-pointer"
          }
        >
          <span
            className={
              promoteApplicant
                ? "flex items-center gap-2.5 text-[13px] font-semibold text-[#1c1c1c]"
                : "flex items-center gap-2 text-[12px] text-[#1c1c1c]"
            }
          >
            <Download
              className={
                promoteApplicant
                  ? "w-4 h-4 text-[#c98a23] group-hover:translate-y-0.5 transition-transform"
                  : "w-3.5 h-3.5 text-[#6e6e73]"
              }
            />
            {promoteApplicant ? "1. Sunum şablonunu indir" : "Sunum şablonunu indir (.pptx)"}
          </span>
          <span
            className={
              promoteApplicant
                ? "text-[10px] font-semibold text-[#9a6814] bg-[#fab758]/20 px-2 py-1 rounded-full"
                : "text-[10px] text-[#aeaeb2]"
            }
          >
            PowerPoint
          </span>
        </a>
      )}

      {/* Yüklenmiş dosya */}
      {file ? (
        <div className="relative flex items-center justify-between gap-3 px-3.5 py-3 bg-emerald-50/60 border border-emerald-200 rounded-xl">
          <div className="flex items-center gap-2.5 min-w-0">
            <FileCheck2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="min-w-0">
              <a
                href={`/api/files/${file.id}`}
                className="block text-[12px] font-medium text-[#1c1c1c] truncate hover:underline"
              >
                {file.name}
              </a>
              <p className="text-[11px] text-[#6e6e73]">{formatSize(file.size)}</p>
            </div>
          </div>
          {canEdit && isApplicant && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors cursor-pointer shrink-0"
            >
              {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
              Sil
            </button>
          )}
        </div>
      ) : (
        isApplicant && canEdit && (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={
              promoteApplicant
                ? "relative w-full flex items-center justify-center gap-2.5 px-4 py-4 bg-[#1c1c1c] text-white text-[14px] font-bold rounded-xl shadow-[0_4px_14px_rgba(0,0,0,0.25)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 transition-all cursor-pointer"
                : "w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#1c1c1c] text-white text-[13px] font-semibold rounded-xl hover:bg-[#2a2a2a] disabled:opacity-50 transition-colors cursor-pointer"
            }
          >
            {uploading ? (
              <>
                <Loader2 className={promoteApplicant ? "w-5 h-5 animate-spin" : "w-4 h-4 animate-spin"} />
                Yükleniyor…
              </>
            ) : (
              <>
                <Upload className={promoteApplicant ? "w-5 h-5" : "w-4 h-4"} />
                {promoteApplicant ? "2. Doldurulmuş Sunumu Yükle" : "Doldurulmuş Sunumu Yükle"}
              </>
            )}
          </button>
        )
      )}

      {/* Admin: tali aksiyonlar — şablon indir + yükle/sil */}
      {showAdminActions && (
        <div className="pt-3 border-t border-black/[0.06] flex flex-wrap items-center gap-2">
          <a
            href={TEMPLATE_URL}
            download={TEMPLATE_NAME}
            className="inline-flex items-center gap-1.5 text-[11px] text-[#6e6e73] hover:text-[#1c1c1c] px-2 py-1 rounded-md hover:bg-[#f5f5f5] transition-colors cursor-pointer"
          >
            <Download className="w-3 h-3" />
            Şablonu indir
          </a>
          <span className="text-[#e0e0e0]">·</span>
          {file ? (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 text-[11px] text-red-600 hover:bg-red-50 px-2 py-1 rounded-md disabled:opacity-50 transition-colors cursor-pointer"
            >
              {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
              Sunumu sil
            </button>
          ) : (
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 text-[11px] text-[#1c1c1c] hover:bg-[#f5f5f5] px-2 py-1 rounded-md disabled:opacity-50 transition-colors cursor-pointer"
            >
              {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
              {uploading ? "Yükleniyor…" : "Sunum yükle (yönetici)"}
            </button>
          )}
        </div>
      )}

      {/* Sahibi değilse / admin — dosya yoksa bilgi */}
      {(isViewer || isAdmin) && !file && (
        <p className="text-[12px] text-[#aeaeb2] italic">
          Henüz sunum yüklenmedi.
        </p>
      )}

      {/* Düzenleme kapalı uyarısı — sadece başvuru sahibi */}
      {isApplicant && !canEdit && !file && (
        <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-700 leading-relaxed">
            Bu başvuru için sunum yükleme şu anda açık değil.
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-red-700">{error}</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".pptx,.ppt,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleUpload(f)
        }}
      />
    </div>
  )
}

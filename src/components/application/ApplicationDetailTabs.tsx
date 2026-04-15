"use client"

import { useState } from "react"
import { FileText, Download, ExternalLink } from "lucide-react"
import { FileNotePanel } from "@/components/jury/FileNotePanel"

type UserProfile = {
  name?: string | null
  email?: string | null
  phone?: string | null
  educationStatus?: string | null
  department?: string | null
  address?: string | null
  communityProfileUrl?: string | null
  linkedinUrl?: string | null
  twitterUrl?: string | null
}

type FileItem = {
  id: string
  name: string
  size: number
  mimeType: string
}

type ApplicationData = {
  title: string
  summary?: string | null
  teamName?: string | null
  teamInfo?: string | null
  targetAudience?: string | null
  categories: string[]
  technologyStage?: string | null
  artStage?: string | null
  researchStage?: string | null
  problemStatement?: string | null
  solution?: string | null
  innovation?: string | null
  outputs?: string | null
  timeline?: string | null
  successCriteria?: string | null
  ecosystemCollaboration?: string | null
  communityContribution?: string | null
  divisionContribution?: string | null
  supportTypes: string[]
  supportNotes?: Record<string, string> | null
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold text-[#aeaeb2] uppercase tracking-wider">{label}</p>
      <p className="text-[13px] text-[#1c1c1c] whitespace-pre-wrap leading-relaxed">{value}</p>
    </div>
  )
}

function LinkField({ label, url }: { label: string; url?: string | null }) {
  if (!url) return null
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold text-[#aeaeb2] uppercase tracking-wider">{label}</p>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-[13px] text-[#fab758] hover:underline break-all"
      >
        {url} <ExternalLink className="w-3 h-3 shrink-0" />
      </a>
    </div>
  )
}

const ALL_TABS = [
  { id: "personal",  label: "Kişisel Bilgiler" },
  { id: "identity",  label: "Proje Kimliği" },
  { id: "problem",   label: "Problem & Çözüm" },
  { id: "plan",      label: "Plan & Hedefler" },
  { id: "ecosystem", label: "Ekosistem" },
  { id: "support",   label: "Destek & Belgeler" },
] as const

type TabId = typeof ALL_TABS[number]["id"]

export function ApplicationDetailTabs({
  application,
  userProfile,
  files,
  showFileNotes = false,
  canEvaluate = false,
  showAuthor = false,
}: {
  application: ApplicationData
  userProfile?: UserProfile | null
  files: FileItem[]
  showFileNotes?: boolean
  canEvaluate?: boolean
  showAuthor?: boolean
}) {
  const tabs = userProfile
    ? ALL_TABS
    : ALL_TABS.filter((t) => t.id !== "personal")

  const [active, setActive] = useState<TabId>(tabs[0].id)

  return (
    <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Tab bar */}
      <div className="flex overflow-x-auto border-b border-black/[0.06]" style={{ scrollbarWidth: "none" }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`shrink-0 px-4 py-3 text-[12px] font-medium transition-colors cursor-pointer whitespace-nowrap border-b-2 -mb-px ${
              active === tab.id
                ? "border-[#fab758] text-[#1c1c1c]"
                : "border-transparent text-[#6e6e73] hover:text-[#1c1c1c]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">

        {/* Kişisel Bilgiler */}
        {active === "personal" && userProfile && (
          <>
            <Field label="Ad Soyad" value={userProfile.name} />
            <Field label="E-posta" value={userProfile.email} />
            <Field label="Telefon" value={userProfile.phone} />
            <Field label="Eğitim Durumu" value={userProfile.educationStatus} />
            <Field label="Bölüm / Alan" value={userProfile.department} />
            <Field label="İkamet Adresi" value={userProfile.address} />
            <LinkField label="Topluluk Profili" url={userProfile.communityProfileUrl} />
            <LinkField label="LinkedIn" url={userProfile.linkedinUrl} />
            <LinkField label="X / Twitter" url={userProfile.twitterUrl} />
          </>
        )}

        {/* Proje Kimliği */}
        {active === "identity" && (
          <>
            <Field label="Proje Adı" value={application.title} />
            <Field label="Ekip / Takım Adı" value={application.teamName} />
            <Field label="30 Saniyelik Özet" value={application.summary} />
            <Field label="Ekip Bilgileri" value={application.teamInfo} />
            <Field label="Hedef Kitle" value={application.targetAudience} />
            {application.categories.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-[#aeaeb2] uppercase tracking-wider">Proje Alanı</p>
                <div className="flex flex-wrap gap-1.5">
                  {application.categories.map((c) => (
                    <span key={c} className="text-[11px] font-medium bg-[#f0f0f0] text-[#6e6e73] px-2.5 py-1 rounded-full">{c}</span>
                  ))}
                </div>
              </div>
            )}
            <Field label="Teknoloji / Girişimcilik — Aşama" value={application.technologyStage} />
            <Field label="Sanat / Kültürel / İçerik — Aşama" value={application.artStage} />
            <Field label="Araştırma / Akademik — Aşama" value={application.researchStage} />
          </>
        )}

        {/* Problem & Çözüm */}
        {active === "problem" && (
          <>
            <Field label="Problem / İhtiyaç Tanımı" value={application.problemStatement} />
            <Field label="Çözüm / Ürün / Hizmet" value={application.solution} />
            <Field label="Yenilik / Özgünlük" value={application.innovation} />
          </>
        )}

        {/* Plan & Hedefler */}
        {active === "plan" && (
          <>
            <Field label="Somut Çıktılar" value={application.outputs} />
            <Field label="Zaman Çizelgesi" value={application.timeline} />
            <Field label="Başarı Kriterleri" value={application.successCriteria} />
          </>
        )}

        {/* Ekosistem */}
        {active === "ecosystem" && (
          <>
            <Field label="Ekosistem İşbirliği Planı" value={application.ecosystemCollaboration} />
            <Field label="Topluluk Katkısı" value={application.communityContribution} />
            <Field label="Divizyon'a Katkı" value={application.divisionContribution} />
          </>
        )}

        {/* Destek & Belgeler */}
        {active === "support" && (
          <>
            {application.supportTypes.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-[#aeaeb2] uppercase tracking-wider">
                  İhtiyaç Duyulan Destek Türleri
                </p>
                <div className="space-y-2">
                  {application.supportTypes.map((s) => {
                    const note = application.supportNotes?.[s]
                    return (
                      <div key={s} className="space-y-1">
                        <span className="text-[12px] font-medium text-[#1c1c1c]">{s}</span>
                        {note && <p className="text-[12px] text-[#6e6e73] leading-relaxed pl-3 border-l-2 border-[#e8e8e8]">{note}</p>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-[#aeaeb2] uppercase tracking-wider">
                Belgeler{files.length > 0 && ` (${files.length})`}
              </p>
              {files.length === 0 ? (
                <p className="text-[13px] text-[#aeaeb2]">Belge yüklenmemiş.</p>
              ) : (
                <ul className="divide-y divide-black/[0.04] border border-black/[0.05] rounded-xl overflow-hidden">
                  {files.map((f) => (
                    <li key={f.id} className={showFileNotes ? "px-4 py-3.5 space-y-2" : "flex items-center gap-3 px-4 py-3 hover:bg-[#f4f4f4] transition-colors"}>
                      {showFileNotes ? (
                        <>
                          <div className="flex items-center justify-between">
                            <div className="min-w-0">
                              <p className="text-[13px] font-medium text-[#1c1c1c] truncate">{f.name}</p>
                              <p className="text-[11px] text-[#aeaeb2] mt-0.5">{formatSize(f.size)}</p>
                            </div>
                            <a
                              href={`/api/files/${f.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="ml-3 shrink-0 text-[12px] font-medium text-[#6e6e73] hover:text-[#1c1c1c] transition-colors"
                            >
                              Aç ↗
                            </a>
                          </div>
                          <FileNotePanel fileId={f.id} canEvaluate={canEvaluate} showAuthor={showAuthor} />
                        </>
                      ) : (
                        <>
                          <div className="w-8 h-8 rounded-lg bg-[#f5f5f5] border border-black/[0.05] flex items-center justify-center shrink-0">
                            <FileText className="w-3.5 h-3.5 text-[#aeaeb2]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-[#1c1c1c] truncate">{f.name}</p>
                            <p className="text-[11px] text-[#aeaeb2] mt-0.5">{formatSize(f.size)}</p>
                          </div>
                          <a
                            href={`/api/files/${f.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="ml-2 shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-[#6e6e73] hover:text-[#1c1c1c] hover:bg-[#f0f0f0] rounded-lg transition-colors cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" /> İndir
                          </a>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

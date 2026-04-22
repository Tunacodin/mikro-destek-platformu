"use client"

import { useState } from "react"
import { ChevronDown, FileText, Download, ExternalLink } from "lucide-react"
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

type FileItem = { id: string; name: string; size: number; mimeType: string }

type ApplicationData = {
  title: string
  summary?: string | null
  teamName?: string | null
  teamInfo?: string | null
  targetAudience?: string | null
  projectFields?: string[]
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
      <a href={url} target="_blank" rel="noreferrer"
        className="inline-flex items-center gap-1 text-[13px] text-[#fab758] hover:underline break-all">
        {url} <ExternalLink className="w-3 h-3 shrink-0" />
      </a>
    </div>
  )
}

type Section = {
  id: string
  title: string
  fieldCount: number
  content: React.ReactNode
}

export function ApplicationAccordion({
  application,
  userProfile,
  files,
  showFileNotes = false,
  canEvaluate = false,
}: {
  application: ApplicationData
  userProfile?: UserProfile | null
  files: FileItem[]
  showFileNotes?: boolean
  canEvaluate?: boolean
}) {
  const sections: Section[] = []

  // Kişisel Bilgiler
  if (userProfile) {
    const fields = [userProfile.name, userProfile.email, userProfile.phone, userProfile.educationStatus, userProfile.department, userProfile.address].filter(Boolean).length
    sections.push({
      id: "personal",
      title: "Kişisel Bilgiler",
      fieldCount: fields,
      content: (
        <div className="space-y-3">
          <Field label="Ad Soyad" value={userProfile.name} />
          <Field label="E-posta" value={userProfile.email} />
          <Field label="Telefon" value={userProfile.phone} />
          <Field label="Eğitim Durumu" value={userProfile.educationStatus} />
          <Field label="Bölüm / Alan" value={userProfile.department} />
          <Field label="İkamet Adresi" value={userProfile.address} />
          <LinkField label="Topluluk Profili" url={userProfile.communityProfileUrl} />
          <LinkField label="LinkedIn" url={userProfile.linkedinUrl} />
          <LinkField label="X / Twitter" url={userProfile.twitterUrl} />
        </div>
      ),
    })
  }

  // Proje Kimliği
  sections.push({
    id: "identity",
    title: "Proje Kimliği",
    fieldCount: [application.title, application.summary, application.teamInfo, application.targetAudience].filter(Boolean).length,
    content: (
      <div className="space-y-3">
        <Field label="Proje Adı" value={application.title} />
        <Field label="Ekip / Takım Adı" value={application.teamName} />
        <Field label="30 Saniyelik Özet" value={application.summary} />
        <Field label="Ekip Bilgileri" value={application.teamInfo} />
        <Field label="Hedef Kitle" value={application.targetAudience} />
        {(application.projectFields ?? []).length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-[#aeaeb2] uppercase tracking-wider">Proje Faaliyet Alanı</p>
            <div className="flex flex-wrap gap-1.5">
              {(application.projectFields ?? []).map((f) => (
                <span key={f} className="text-[11px] font-medium bg-[#f0f0f0] text-[#6e6e73] px-2.5 py-1 rounded-full">{f}</span>
              ))}
            </div>
          </div>
        )}
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
      </div>
    ),
  })

  // Problem & Çözüm
  sections.push({
    id: "problem",
    title: "Problem & Çözüm",
    fieldCount: [application.problemStatement, application.solution, application.innovation].filter(Boolean).length,
    content: (
      <div className="space-y-3">
        <Field label="Problem / İhtiyaç Tanımı" value={application.problemStatement} />
        <Field label="Çözüm / Ürün / Hizmet" value={application.solution} />
        <Field label="Yenilik / Özgünlük" value={application.innovation} />
      </div>
    ),
  })

  // Plan & Hedefler
  sections.push({
    id: "plan",
    title: "Plan & Hedefler",
    fieldCount: [application.outputs, application.timeline, application.successCriteria].filter(Boolean).length,
    content: (
      <div className="space-y-3">
        <Field label="Somut Çıktılar" value={application.outputs} />
        <Field label="Zaman Çizelgesi" value={application.timeline} />
        <Field label="Başarı Kriterleri" value={application.successCriteria} />
      </div>
    ),
  })

  // Ekosistem
  sections.push({
    id: "ecosystem",
    title: "Ekosistem & Topluluk",
    fieldCount: [application.ecosystemCollaboration, application.communityContribution, application.divisionContribution].filter(Boolean).length,
    content: (
      <div className="space-y-3">
        <Field label="Ekosistem İşbirliği Planı" value={application.ecosystemCollaboration} />
        <Field label="Topluluk Katkısı" value={application.communityContribution} />
        <Field label="Divizyon'a Katkı" value={application.divisionContribution} />
      </div>
    ),
  })

  // Destek & Belgeler
  sections.push({
    id: "support",
    title: "Destek & Belgeler",
    fieldCount: application.supportTypes.length + files.length,
    content: (
      <div className="space-y-3">
        {application.supportTypes.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-[#aeaeb2] uppercase tracking-wider">İhtiyaç Duyulan Destek Türleri</p>
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
            <div className="space-y-2">
              {files.map((f) => (
                <div key={f.id} className={showFileNotes ? "space-y-2" : "flex items-center gap-3"}>
                  {showFileNotes ? (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-[#1c1c1c] truncate">{f.name}</p>
                          <p className="text-[11px] text-[#aeaeb2] mt-0.5">{formatSize(f.size)}</p>
                        </div>
                        <a href={`/api/files/${f.id}`} target="_blank" rel="noreferrer"
                          className="ml-3 shrink-0 text-[12px] font-medium text-[#6e6e73] hover:text-[#1c1c1c] transition-colors">
                          Aç ↗
                        </a>
                      </div>
                      <FileNotePanel fileId={f.id} canEvaluate={canEvaluate} />
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
                      <a href={`/api/files/${f.id}`} target="_blank" rel="noreferrer"
                        className="ml-2 shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-[#6e6e73] hover:text-[#1c1c1c] hover:bg-[#f0f0f0] rounded-lg transition-colors cursor-pointer">
                        <Download className="w-3.5 h-3.5" /> İndir
                      </a>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    ),
  })

  // İlk açılışta Proje Kimliği açık olsun
  const [openIds, setOpenIds] = useState<Set<string>>(new Set(["identity"]))

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function expandAll() {
    setOpenIds(new Set(sections.map((s) => s.id)))
  }

  function collapseAll() {
    setOpenIds(new Set())
  }

  return (
    <div className="space-y-2">
      {/* Tümünü aç/kapat */}
      <div className="flex justify-end gap-2 mb-1">
        <button onClick={expandAll} className="text-[11px] text-[#6e6e73] hover:text-[#1c1c1c] transition-colors cursor-pointer">
          Tümünü Aç
        </button>
        <span className="text-[#d1d1d6]">·</span>
        <button onClick={collapseAll} className="text-[11px] text-[#6e6e73] hover:text-[#1c1c1c] transition-colors cursor-pointer">
          Tümünü Kapat
        </button>
      </div>

      {sections.map((section) => {
        const isOpen = openIds.has(section.id)
        return (
          <div key={section.id} className="rounded-xl border border-black/[0.06] bg-white overflow-hidden">
            <button
              onClick={() => toggle(section.id)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#fafafa] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-[13px] font-semibold text-[#1c1c1c]">{section.title}</span>
                <span className="text-[11px] text-[#aeaeb2] bg-[#f0f0f0] px-1.5 py-0.5 rounded-md tabular-nums">
                  {section.fieldCount}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-[#aeaeb2] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </button>
            {isOpen && (
              <div className="px-4 pb-4 pt-1 border-t border-black/[0.04]">
                {section.content}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import {
  ChevronLeft, FileText, CheckCircle2, Clock,
  Calendar, FolderOpen, Download, Layers, Zap, Star, Send, ExternalLink,
} from "lucide-react"
import { JuryProjectNoteForm } from "./JuryProjectNoteForm"
import { FileNotePanel } from "@/components/jury/FileNotePanel"

export const metadata = { title: "Proje Takibi — Mikro Destek Fonu" }

const SCOPE_LABELS: Record<string, string> = {
  LIMITED:  "Sınırlı Destek",
  EXTENDED: "Genişletilmiş Destek",
  PRIORITY: "Öncelikli Destek",
}

const SCOPE_ICON: Record<string, React.ElementType> = {
  LIMITED:  Layers,
  EXTENDED: Zap,
  PRIORITY: Star,
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
}

function fmtShort(d: Date) {
  return new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })
}

export default async function JuryProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session || session.user.role !== "JURY") redirect("/login")

  const { id: applicationId } = await params
  const juryId = session.user.id

  // Erişim kontrolü: jüri bu başvuruya atanmış olmalı
  const assignment = await prisma.juryAssignment.findUnique({
    where: { juryId_applicationId: { juryId, applicationId } },
  })
  if (!assignment) notFound()

  const project = await prisma.project.findUnique({
    where: { applicationId },
    include: {
      application: {
        include: {
          period:  { select: { title: true } },
          program: { select: { title: true } },
          files:   { select: { id: true, name: true, size: true, type: true, url: true }, orderBy: { createdAt: "asc" } },
        },
      },
      decision: { select: { scope: true, notes: true, decidedAt: true } },
      files:    { select: { id: true, name: true, size: true, mimeType: true, type: true, url: true }, orderBy: { createdAt: "asc" } },
      // Sadece başvuru sahibi raporları (juryId null) + bu jürinin kendi notları
      reports: {
        where: { OR: [{ juryId: null }, { juryId }] },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!project) notFound()

  const isActive = project.status === "ACTIVE"
  const scope = project.decision.scope
  const ScopeIcon = SCOPE_ICON[scope] ?? Layers

  // Raporları ayır
  const applicantReports = project.reports.filter((r) => r.juryId === null)
  const myNotes = project.reports.filter((r) => r.juryId === juryId)

  return (
    <div className="p-4 sm:p-8 space-y-6">

      {/* Geri */}
      <Link
        href="/jury/projects"
        className="inline-flex items-center gap-1.5 text-[13px] text-[#6e6e73] hover:text-[#1c1c1c] transition-colors cursor-pointer"
      >
        <ChevronLeft className="w-3.5 h-3.5" /> Desteklenen Projeler
      </Link>

      {/* Header */}
      <div className="pb-6 border-b border-[#e8e8e8]">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
              }`}>
                {isActive ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                {isActive ? "Aktif Proje" : "Kapandı"}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#6e6e73] bg-[#f0f0f0] px-2.5 py-1 rounded-full">
                <ScopeIcon className="w-3 h-3" />
                {SCOPE_LABELS[scope] ?? scope}
              </span>
            </div>
            <h1 className="text-[22px] font-bold text-[#1c1c1c] tracking-tight leading-snug">
              {project.application.title}
            </h1>
            <div className="flex items-center gap-3 flex-wrap text-[12px] text-[#6e6e73]">
              <span className="inline-flex items-center gap-1">
                <Layers className="w-3 h-3 text-[#aeaeb2]" /> {project.application.period?.title ?? project.application.program?.title ?? "—"}
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#aeaeb2]" /> Karar: {fmtShort(project.decision.decidedAt)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Send className="w-3 h-3 text-[#aeaeb2]" /> {applicantReports.length} güncelleme
              </span>
              <span className="inline-flex items-center gap-1">
                <FileText className="w-3 h-3 text-[#aeaeb2]" />
                {project.files.length + project.application.files.length} dosya
              </span>
            </div>
            <div className="pt-1">
              <Link
                href={`/jury/projects/${applicationId}/decision-report`}
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#1c1c1c] bg-[#f0f0f0] hover:bg-[#e8e8e8] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" /> Destek Sonuç Bildirimi
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* İçerik: 50/50 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Sol: Dosyalar + FileNote */}
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-5 py-4 border-b border-black/[0.04] flex items-center justify-between">
            <p className="text-[13px] font-semibold text-[#1c1c1c] flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-[#aeaeb2]" /> Proje Materyalleri
            </p>
            <span className="text-[11px] text-[#aeaeb2]">
              {project.files.length + project.application.files.length} dosya
            </span>
          </div>

          {/* Proje dosyaları */}
          {project.files.length > 0 && (
            <ul className="divide-y divide-black/[0.04]">
              {project.files.map((f) => {
                const isLink = f.type === "LINK"
                const href = isLink && f.url ? f.url : `/api/files/${f.id}`
                return (
                <li key={f.id} className="px-5 py-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#f5f5f5] border border-black/[0.05] flex items-center justify-center shrink-0">
                      {isLink ? (
                        <ExternalLink className="w-3.5 h-3.5 text-[#6e6e73]" />
                      ) : (
                        <FileText className="w-3.5 h-3.5 text-[#aeaeb2]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[#1c1c1c] truncate">{f.name}</p>
                      <p className="text-[11px] text-[#aeaeb2]">{isLink ? "Harici link" : formatSize(f.size)}</p>
                    </div>
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-[#6e6e73] hover:text-[#1c1c1c] hover:bg-[#f0f0f0] rounded-lg transition-colors cursor-pointer"
                    >
                      {isLink ? (
                        <><ExternalLink className="w-3 h-3" /> Aç</>
                      ) : (
                        <><Download className="w-3 h-3" /> İndir</>
                      )}
                    </a>
                  </div>
                  <div className="pl-11">
                    <FileNotePanel fileId={f.id} canEvaluate={true} />
                  </div>
                </li>
                )
              })}
            </ul>
          )}

          {/* Başvuru belgeleri */}
          {project.application.files.length > 0 && (
            <>
              <div className="px-5 py-2.5 bg-[#fafafa] border-t border-black/[0.04]">
                <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-wider">Başvuru Belgeleri</p>
              </div>
              <ul className="divide-y divide-black/[0.04]">
                {project.application.files.map((f) => {
                  const isLink = f.type === "LINK"
                  const href = isLink && f.url ? f.url : `/api/files/${f.id}`
                  return (
                  <li key={f.id} className="px-5 py-3 space-y-2">
                    <div className="flex items-center gap-2">
                      {isLink ? (
                        <ExternalLink className="w-3.5 h-3.5 text-[#6e6e73] shrink-0" />
                      ) : (
                        <FileText className="w-3.5 h-3.5 text-[#d1d1d6] shrink-0" />
                      )}
                      <span className="text-[12px] text-[#6e6e73] truncate flex-1">{f.name}</span>
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 text-[11px] text-[#aeaeb2] hover:text-[#1c1c1c] transition-colors cursor-pointer"
                      >
                        {isLink ? "Aç" : "İndir"}
                      </a>
                    </div>
                    <div className="pl-6">
                      <FileNotePanel fileId={f.id} canEvaluate={true} />
                    </div>
                  </li>
                  )
                })}
              </ul>
            </>
          )}

          {project.files.length === 0 && project.application.files.length === 0 && (
            <div className="px-5 py-8 text-center">
              <FolderOpen className="w-6 h-6 text-[#d1d1d6] mx-auto mb-2" />
              <p className="text-[13px] text-[#aeaeb2]">Henüz dosya yüklenmedi.</p>
            </div>
          )}
        </div>

        {/* Sağ: Raporlar + Jüri Notu */}
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-5 py-4 border-b border-black/[0.04] flex items-center justify-between">
            <p className="text-[13px] font-semibold text-[#1c1c1c] flex items-center gap-2">
              <Send className="w-4 h-4 text-[#aeaeb2]" /> Güncelleme Notları
            </p>
            <span className="text-[11px] text-[#aeaeb2]">{applicantReports.length} not</span>
          </div>

          {/* Başvuru sahibi güncellemeleri */}
          {applicantReports.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <Send className="w-5 h-5 text-[#d1d1d6] mx-auto mb-2" />
              <p className="text-[13px] text-[#aeaeb2]">Başvuru sahibi henüz güncelleme göndermedi.</p>
            </div>
          ) : (
            <ul className="divide-y divide-black/[0.04]">
              {applicantReports.map((r, i) => (
                <li key={r.id} className="px-5 py-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] font-semibold text-[#1c1c1c]">
                      Not #{applicantReports.length - i}
                    </p>
                    <p className="text-[11px] text-[#aeaeb2]">{fmtShort(r.createdAt)}</p>
                  </div>
                  <p className="text-[13px] text-[#6e6e73] leading-relaxed whitespace-pre-wrap">
                    {r.content}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {/* Jüri notları bölümü */}
          <div className="border-t border-black/[0.04]">
            <div className="px-5 py-3 bg-[#fafafa] flex items-center justify-between">
              <p className="text-[11px] font-semibold text-[#aeaeb2] uppercase tracking-wider flex items-center gap-1.5">
                Geri Bildirim Görüş ve Öneriler
                <span className="font-normal normal-case text-[10px] bg-[#ebebeb] text-[#aeaeb2] px-2 py-0.5 rounded-full">
                  Sadece Yönetici Görecek
                </span>
              </p>
              <span className="text-[11px] text-[#aeaeb2]">{myNotes.length} not</span>
            </div>

            {myNotes.length > 0 && (
              <ul className="divide-y divide-black/[0.04]">
                {myNotes.map((r, i) => (
                  <li key={r.id} className="px-5 py-4 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[12px] font-semibold text-[#1c1c1c]">
                        Geri Bildirim #{myNotes.length - i}
                      </p>
                      <p className="text-[11px] text-[#aeaeb2]">{fmtShort(r.createdAt)}</p>
                    </div>
                    <p className="text-[13px] text-[#6e6e73] leading-relaxed whitespace-pre-wrap">
                      {r.content}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            {isActive && (
              <div className="px-5 py-4 bg-[#fafafa] border-t border-black/[0.04]">
                <p className="text-[12px] font-semibold text-[#1c1c1c] mb-2">Geri Bildirim Görüş ve Öneri Gönder</p>
                <JuryProjectNoteForm applicationId={applicationId} />
              </div>
            )}

            {!isActive && (
              <div className="px-5 py-3 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#aeaeb2]" />
                <p className="text-[12px] text-[#6e6e73]">Proje kapandı. Yeni not gönderilemez.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

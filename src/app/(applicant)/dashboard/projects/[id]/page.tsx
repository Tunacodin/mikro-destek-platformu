import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import {
  ChevronLeft, FileText, Send, CheckCircle2, Clock,
  Calendar, FolderOpen, Download, AlertTriangle, Layers, Zap, Star,
} from "lucide-react"
import { ProjectReportForm } from "./ProjectReportForm"
import { ProjectFileUpload } from "./ProjectFileUpload"
import { InlineCountdown } from "@/components/ui/InlineCountdown"

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

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session || session.user.role !== "APPLICANT") redirect("/login")

  const { id: applicationId } = await params

  const project = await prisma.project.findUnique({
    where: { applicationId },
    include: {
      application: {
        include: {
          user:    { select: { id: true } },
          period:  { select: { title: true } },
          program: { select: { title: true } },
          files:   { select: { id: true, name: true, size: true }, orderBy: { createdAt: "asc" } },
        },
      },
      decision: { select: { scope: true, notes: true, decidedAt: true } },
      files:    { select: { id: true, name: true, size: true, mimeType: true }, orderBy: { createdAt: "asc" } },
      reports:  { orderBy: { createdAt: "desc" } },
    },
  })

  if (!project || project.application.user.id !== session.user.id) notFound()

  const now = Date.now()
  const isActive = project.status === "ACTIVE"
  const applicantReports = project.reports.filter((r) => r.juryId === null)
  const showSupportEnd = !!project.supportEndDate && project.supportEndDate.getTime() > now
  const endingSoon = isActive && project.supportEndDate && (project.supportEndDate.getTime() - now) < 7 * 24 * 3_600_000

  const scope = project.decision.scope
  const ScopeIcon = SCOPE_ICON[scope] ?? Layers

  return (
    <div className="space-y-6">

      {/* Geri */}
      <Link
        href="/dashboard/projects"
        className="inline-flex items-center gap-1.5 text-[13px] text-[#6e6e73] hover:text-[#1c1c1c] transition-colors cursor-pointer"
      >
        <ChevronLeft className="w-3.5 h-3.5" /> Desteklerim
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
              {project.supportEndDate && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#aeaeb2]" /> Bitiş: {fmtShort(project.supportEndDate)}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Send className="w-3 h-3 text-[#aeaeb2]" /> {applicantReports.length} güncelleme notu
              </span>
              <span className="inline-flex items-center gap-1">
                <FileText className="w-3 h-3 text-[#aeaeb2]" /> {project.files.length} dosya
              </span>
            </div>
          </div>

          {/* Sağ: geri sayım */}
          {showSupportEnd && (
            <div className="shrink-0">
              <InlineCountdown targetDate={project.supportEndDate!} label="Destek Bitişine" />
            </div>
          )}
        </div>

      </div>

      {/* Bitiyor uyarısı */}
      {endingSoon && (
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-[12px] font-semibold text-amber-800">Destek süresi bitiyor</p>
            <p className="text-[11px] text-amber-700 mt-0.5">7 günden az kaldı. Kapanış dosyalarınızı yükleyin.</p>
          </div>
        </div>
      )}

      {/* İçerik: %50-%50 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Sol: Proje Dosyaları */}
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-5 py-4 border-b border-black/[0.04] flex items-center justify-between">
            <p className="text-[13px] font-semibold text-[#1c1c1c] flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-[#aeaeb2]" /> Proje Materyalleri ve Raporlar
            </p>
            <span className="text-[11px] text-[#aeaeb2]">{project.files.length + project.application.files.length} dosya</span>
          </div>

          {/* Proje dosyaları */}
          {project.files.length > 0 && (
            <ul className="divide-y divide-black/[0.04]">
              {project.files.map((f) => (
                <li key={f.id} className="flex items-center gap-3 px-5 py-3 hover:bg-[#fafafa] transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-[#f5f5f5] border border-black/[0.05] flex items-center justify-center shrink-0">
                    <FileText className="w-3.5 h-3.5 text-[#aeaeb2]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[#1c1c1c] truncate">{f.name}</p>
                    <p className="text-[11px] text-[#aeaeb2]">{formatSize(f.size)}</p>
                  </div>
                  <a href={`/api/files/${f.id}`} target="_blank" rel="noreferrer"
                    className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-[#6e6e73] hover:text-[#1c1c1c] hover:bg-[#f0f0f0] rounded-lg transition-colors cursor-pointer">
                    <Download className="w-3 h-3" /> İndir
                  </a>
                </li>
              ))}
            </ul>
          )}

          {/* Başvuru belgeleri */}
          {project.application.files.length > 0 && (
            <>
              <div className="px-5 py-2.5 bg-[#fafafa] border-t border-black/[0.04]">
                <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-wider">Başvuru Belgeleri</p>
              </div>
              <ul className="divide-y divide-black/[0.04]">
                {project.application.files.map((f) => (
                  <li key={f.id} className="flex items-center justify-between px-5 py-2.5 hover:bg-[#fafafa] transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-3.5 h-3.5 text-[#d1d1d6] shrink-0" />
                      <span className="text-[12px] text-[#6e6e73] truncate">{f.name}</span>
                    </div>
                    <a href={`/api/files/${f.id}`} target="_blank" rel="noreferrer"
                      className="shrink-0 text-[11px] text-[#aeaeb2] hover:text-[#1c1c1c] transition-colors cursor-pointer ml-2">
                      İndir
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}

          {project.files.length === 0 && project.application.files.length === 0 && (
            <div className="px-5 py-8 text-center">
              <FolderOpen className="w-6 h-6 text-[#d1d1d6] mx-auto mb-2" />
              <p className="text-[13px] text-[#aeaeb2]">Henüz dosya yüklenmedi.</p>
            </div>
          )}

          {/* Dosya yükle */}
          {isActive && (
            <div className="px-5 py-4 border-t border-black/[0.04] bg-[#fafafa]">
              <ProjectFileUpload projectId={project.id} />
            </div>
          )}
        </div>

        {/* Sağ: İlerleme Raporları */}
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-5 py-4 border-b border-black/[0.04] flex items-center justify-between">
            <p className="text-[13px] font-semibold text-[#1c1c1c] flex items-center gap-2">
              <Send className="w-4 h-4 text-[#aeaeb2]" /> Güncelleme Notları
            </p>
            <span className="text-[11px] text-[#aeaeb2]">{applicantReports.length} not</span>
          </div>

          {applicantReports.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <Send className="w-5 h-5 text-[#d1d1d6] mx-auto mb-2" />
              <p className="text-[13px] text-[#aeaeb2]">Henüz güncelleme notu gönderilmedi.</p>
              <p className="text-[11px] text-[#c7c7cc] mt-0.5">Proje ilerlemesini aşağıdan paylaşın.</p>
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

          {/* Rapor gönder */}
          {isActive && (
            <div className="px-5 py-4 border-t border-black/[0.04] bg-[#fafafa]">
              <p className="text-[12px] font-semibold text-[#1c1c1c] mb-2">Yeni Not</p>
              <ProjectReportForm applicationId={applicationId} />
            </div>
          )}

          {!isActive && (
            <div className="px-5 py-3 border-t border-black/[0.04] bg-[#fafafa] flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-[#aeaeb2]" />
              <p className="text-[12px] text-[#6e6e73]">Proje kapandı. Yeni not gönderilemez.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

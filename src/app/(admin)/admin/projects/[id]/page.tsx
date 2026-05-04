import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import {
  ChevronLeft, FileText, Send, CheckCircle2, FolderOpen,
  Download, Calendar, User, ExternalLink,
} from "lucide-react"
import { ProjectStatusPanel } from "./ProjectStatusPanel"
import { FileNotePanel } from "@/components/jury/FileNotePanel"

export const metadata = { title: "Proje Yönetimi — Mikro Destek Fonu" }

const SCOPE_LABELS: Record<string, string> = {
  LIMITED:  "Sınırlı Destek",
  EXTENDED: "Genişletilmiş Destek",
  PRIORITY: "Öncelikli Destek",
}

const SCOPE_COLORS: Record<string, { badge: string; bar: string }> = {
  LIMITED:  { badge: "bg-amber-50 text-amber-700 border-amber-200",       bar: "bg-amber-400" },
  EXTENDED: { badge: "bg-blue-50 text-blue-700 border-blue-200",         bar: "bg-blue-400" },
  PRIORITY: { badge: "bg-emerald-50 text-emerald-700 border-emerald-200", bar: "bg-emerald-500" },
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default async function AdminProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") redirect("/login")

  const { id } = await params

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      application: {
        include: {
          user:    { select: { id: true, name: true, email: true } },
          period:  { select: { title: true } },
          program: { select: { title: true } },
          files:   { select: { id: true, name: true, size: true, type: true, url: true }, orderBy: { createdAt: "asc" } },
        },
      },
      decision: { select: { scope: true, notes: true, decidedAt: true, decidedBy: { select: { name: true, email: true } } } },
      files:    { select: { id: true, name: true, size: true, mimeType: true, type: true, url: true, createdAt: true }, orderBy: { createdAt: "desc" } },
      reports:  { orderBy: { createdAt: "desc" } },
    },
  })

  if (!project) notFound()

  const applicantReports = project.reports.filter((r) => r.juryId === null)
  const juryNotes = project.reports.filter((r) => r.juryId !== null)

  const scope  = project.decision.scope
  const colors = SCOPE_COLORS[scope] ?? { badge: "bg-slate-50 text-slate-600 border-slate-200", bar: "bg-slate-400" }
  const label  = SCOPE_LABELS[scope] ?? scope

  const fmt = (d: Date) =>
    new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })

  return (
    <div className="space-y-5">
      {/* Geri */}
      <Link
        href="/admin/projects"
        className="inline-flex items-center gap-1 text-[13px] text-[#6e6e73] hover:text-[#1c1c1c] transition-colors cursor-pointer"
      >
        <ChevronLeft className="w-3.5 h-3.5" /> Desteklenen Projeler
      </Link>

      {/* Başlık */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-[0.12em] mb-1">
              {project.application.period?.title ?? project.application.program?.title ?? "—"}
            </p>
            <h1 className="text-[17px] font-semibold text-[#1c1c1c] leading-snug">
              {project.application.title}
            </h1>
            <div className="flex items-center gap-1.5 mt-1.5">
              <User className="w-3 h-3 text-[#aeaeb2]" />
              <p className="text-[12px] text-[#6e6e73]">
                {project.application.user.name ?? project.application.user.email}
              </p>
              <span className="text-[#d1d1d6] mx-0.5">·</span>
              <Link
                href={`/admin/applications/${project.application.id}`}
                className="inline-flex items-center gap-1 text-[12px] text-[#fab758] hover:text-amber-600 transition-colors cursor-pointer"
              >
                Başvuruyu Gör <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${colors.badge}`}>
              {label}
            </span>
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${project.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
              {project.status === "ACTIVE" ? "Aktif" : project.status}
            </span>
          </div>
        </div>
      </div>

      {/* 2 Kolon */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Sol */}
        <div className="lg:col-span-2 space-y-4">

          {/* İlerleme Raporları */}
          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-black/[0.05] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-3.5 h-3.5 text-[#aeaeb2]" />
                <p className="text-[12px] font-semibold text-[#1c1c1c]">Güncelleme Notları</p>
              </div>
              <span className="text-[11px] text-[#aeaeb2]">{applicantReports.length} güncelleme notu</span>
            </div>

            {applicantReports.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <Send className="w-5 h-5 text-[#d1d1d6] mx-auto mb-2" />
                <p className="text-[13px] text-[#aeaeb2]">Henüz güncelleme notu gönderilmedi.</p>
              </div>
            ) : (
              <ul className="divide-y divide-black/[0.04]">
                {applicantReports.map((r, i) => (
                  <li key={r.id} className="px-5 sm:px-6 py-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <p className="text-[11px] font-semibold text-[#aeaeb2] uppercase tracking-wider">
                        Not #{applicantReports.length - i}
                      </p>
                      <span className="text-[#d1d1d6]">·</span>
                      <p className="text-[11px] text-[#aeaeb2]">{fmt(r.createdAt)}</p>
                    </div>
                    <p className="text-[13px] text-[#1c1c1c] leading-relaxed whitespace-pre-wrap pl-5">
                      {r.content}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            {juryNotes.length > 0 && (
              <>
                <div className="px-5 sm:px-6 py-2.5 bg-purple-50/60 border-t border-black/[0.04] flex items-center gap-2">
                  <p className="text-[10px] font-semibold text-purple-500 uppercase tracking-wider">Geri Bildirim Görüş ve Öneriler</p>
                  <span className="text-[10px] text-purple-400">({juryNotes.length})</span>
                </div>
                <ul className="divide-y divide-black/[0.04]">
                  {juryNotes.map((r, i) => (
                    <li key={r.id} className="px-5 sm:px-6 py-4 space-y-2 bg-purple-50/30">
                      <div className="flex items-center gap-2">
                        <p className="text-[11px] font-semibold text-purple-500 uppercase tracking-wider">
                          Geri Bildirim #{juryNotes.length - i}
                        </p>
                        <span className="text-[#d1d1d6]">·</span>
                        <p className="text-[11px] text-[#aeaeb2]">{fmt(r.createdAt)}</p>
                      </div>
                      <p className="text-[13px] text-[#1c1c1c] leading-relaxed whitespace-pre-wrap pl-5">
                        {r.content}
                      </p>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* Proje Dosyaları (üye tarafından yüklenen) */}
          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-black/[0.05] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-3.5 h-3.5 text-[#aeaeb2]" />
                <p className="text-[12px] font-semibold text-[#1c1c1c]">Proje Materyalleri ve Raporlar</p>
                <span className="text-[#aeaeb2] text-[12px] font-normal">
                  (üye tarafından yüklendi)
                </span>
              </div>
              <span className="text-[11px] text-[#aeaeb2]">{project.files.length} dosya</span>
            </div>

            {project.files.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <FolderOpen className="w-5 h-5 text-[#d1d1d6] mx-auto mb-2" />
                <p className="text-[13px] text-[#aeaeb2]">Henüz dosya yüklenmedi.</p>
              </div>
            ) : (
              <ul className="divide-y divide-black/[0.04]">
                {project.files.map((f) => {
                  const isLink = f.type === "LINK"
                  const href = isLink && f.url ? f.url : `/api/files/${f.id}`
                  return (
                  <li key={f.id} className="flex items-center gap-3 px-5 sm:px-6 py-3.5 hover:bg-[#f4f4f4] transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-[#f5f5f5] border border-black/[0.05] flex items-center justify-center shrink-0">
                      {isLink ? (
                        <ExternalLink className="w-3.5 h-3.5 text-[#6e6e73]" />
                      ) : (
                        <FileText className="w-3.5 h-3.5 text-[#aeaeb2]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[#1c1c1c] truncate">{f.name}</p>
                      <p className="text-[11px] text-[#aeaeb2]">{isLink ? "Harici link" : formatSize(f.size)} · {fmt(f.createdAt)}</p>
                    </div>
                    <a
                      href={href} target="_blank" rel="noreferrer"
                      className="ml-2 shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-[#6e6e73] hover:text-[#1c1c1c] hover:bg-[#f0f0f0] rounded-lg transition-colors cursor-pointer"
                    >
                      {isLink ? (
                        <><ExternalLink className="w-3.5 h-3.5" /> Aç</>
                      ) : (
                        <><Download className="w-3.5 h-3.5" /> İndir</>
                      )}
                    </a>
                  </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Başvuru Dosyaları */}
          {project.application.files.length > 0 && (
            <details open className="group bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] overflow-hidden">
              <summary className="flex items-center justify-between px-5 sm:px-6 py-4 cursor-pointer select-none hover:bg-[#f4f4f4] transition-colors">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-[#aeaeb2]" />
                  <span className="text-[12px] font-semibold text-[#1c1c1c]">Başvuru Belgeleri</span>
                  <span className="text-[#aeaeb2] text-[12px] font-normal">{project.application.files.length} dosya</span>
                </div>
                <span className="text-[11px] text-[#aeaeb2] group-open:hidden">Göster</span>
                <span className="text-[11px] text-[#aeaeb2] hidden group-open:block">Gizle</span>
              </summary>
              <ul className="divide-y divide-black/[0.04] border-t border-black/[0.04]">
                {project.application.files.map((f) => {
                  const isLink = f.type === "LINK"
                  const href = isLink && f.url ? f.url : `/api/files/${f.id}`
                  return (
                  <li key={f.id} className="px-5 sm:px-6 py-3 space-y-2 hover:bg-[#f4f4f4] transition-colors">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        {isLink ? (
                          <ExternalLink className="w-3.5 h-3.5 text-[#6e6e73] shrink-0" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-[#aeaeb2] shrink-0" />
                        )}
                        <span className="text-[13px] text-[#1c1c1c] truncate">{f.name}</span>
                        <span className="text-[11px] text-[#aeaeb2] shrink-0">{isLink ? "Harici link" : formatSize(f.size)}</span>
                      </div>
                      <a href={href} target="_blank" rel="noreferrer"
                        className="ml-3 shrink-0 text-[12px] font-medium text-[#6e6e73] hover:text-[#1c1c1c] transition-colors cursor-pointer">
                        {isLink ? "Aç" : "İndir"}
                      </a>
                    </div>
                    <FileNotePanel fileId={f.id} canEvaluate={false} showAuthor />
                  </li>
                  )
                })}
              </ul>
            </details>
          )}
        </div>

        {/* Sağ — Yönetim paneli */}
        <div className="space-y-4">
          <ProjectStatusPanel
            projectId={project.id}
            currentStatus={project.status}
            currentSupportEndDate={project.supportEndDate?.toISOString() ?? null}
          />

          {/* Destek özeti */}
          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] p-4 space-y-3">
            <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-[0.12em]">
              Destek Özeti
            </p>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${colors.bar}`} />
              <span className="text-[13px] font-semibold text-[#1c1c1c]">{label}</span>
            </div>
            <div className="space-y-1.5 text-[12px]">
              <div className="flex justify-between">
                <span className="text-[#6e6e73]">Karar tarihi</span>
                <span className="font-medium text-[#1c1c1c]">{fmt(project.decision.decidedAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6e6e73]">Karar veren</span>
                <span className="font-medium text-[#1c1c1c]">
                  {project.decision.decidedBy.name ?? project.decision.decidedBy.email}
                </span>
              </div>
              {project.supportEndDate && (
                <div className="flex justify-between">
                  <span className="text-[#6e6e73] flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Destek bitişi
                  </span>
                  <span className="font-medium text-[#1c1c1c]">{fmt(project.supportEndDate)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#6e6e73]">Güncelleme notu</span>
                <span className="font-medium text-[#1c1c1c]">{applicantReports.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6e6e73]">Proje materyali</span>
                <span className="font-medium text-[#1c1c1c]">{project.files.length}</span>
              </div>
            </div>
            {project.decision.notes && (
              <p className="text-[12px] text-[#6e6e73] leading-relaxed bg-[#f9f9f9] rounded-lg px-3 py-2 border-t border-black/[0.05]">
                {project.decision.notes}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

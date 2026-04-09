import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import {
  ChevronLeft, FileText, Send, CheckCircle2, Clock,
  Calendar, FolderOpen, Download, AlertTriangle,
} from "lucide-react"
import { ProjectReportForm } from "./ProjectReportForm"
import { ProjectFileUpload } from "./ProjectFileUpload"
import { CountdownTimer } from "@/components/ui/CountdownTimer"

export const metadata = { title: "Proje Takibi — Mikro Destek Fonu" }

const SCOPE_LABELS: Record<string, string> = {
  LIMITED:  "Sınırlı Destek",
  EXTENDED: "Genişletilmiş Destek",
  PRIORITY: "Öncelikli Destek",
}

const SCOPE_COLORS: Record<string, { badge: string; bar: string; dot: string }> = {
  LIMITED:  { badge: "bg-amber-50 text-amber-700 border-amber-200",   bar: "bg-amber-400",   dot: "bg-amber-400" },
  EXTENDED: { badge: "bg-blue-50 text-blue-700 border-blue-200",     bar: "bg-blue-400",    dot: "bg-blue-400" },
  PRIORITY: { badge: "bg-emerald-50 text-emerald-700 border-emerald-200", bar: "bg-emerald-500", dot: "bg-emerald-500" },
}

const SCOPE_DESC: Record<string, string> = {
  LIMITED:  "Temel kaynak desteği",
  EXTENDED: "Kapsamlı kaynak ve mentorluk",
  PRIORITY: "Tam destek paketi + ekosistem entegrasyonu",
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
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
          user:   { select: { id: true } },
          period: { select: { title: true } },
          files:  { select: { id: true, name: true, size: true }, orderBy: { createdAt: "asc" } },
        },
      },
      decision: { select: { scope: true, notes: true, decidedAt: true } },
      files:    { select: { id: true, name: true, size: true, mimeType: true }, orderBy: { createdAt: "asc" } },
      reports:  { orderBy: { createdAt: "desc" } },
    },
  })

  if (!project || project.application.user.id !== session.user.id) notFound()

  const now = Date.now()
  const showSupportEnd = !!project.supportEndDate && project.supportEndDate.getTime() > now
  const isLocked = project.status !== "ACTIVE"

  const scope   = project.decision.scope
  const colors  = SCOPE_COLORS[scope] ?? { badge: "bg-slate-50 text-slate-600 border-slate-200", bar: "bg-slate-400", dot: "bg-slate-400" }
  const label   = SCOPE_LABELS[scope] ?? scope
  const desc    = SCOPE_DESC[scope] ?? ""

  const fmt = (d: Date) =>
    new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })

  // Süreç adımları
  const steps = [
    { id: 1, label: "Destek Kararı",      desc: `${label} — ${fmt(project.decision.decidedAt)}`, done: true },
    { id: 2, label: "Proje Başlatıldı",   desc: "Proje aktif, çalışmalar devam ediyor",           done: project.status === "ACTIVE" },
    { id: 3, label: "İlerleme Raporları", desc: `${project.reports.length} rapor gönderildi`,     done: project.reports.length > 0, active: project.status === "ACTIVE" },
    { id: 4, label: "Proje Kapanışı",     desc: project.supportEndDate ? `Bitiş: ${fmt(project.supportEndDate)}` : "Tarih belirlenmedi", done: project.status !== "ACTIVE" },
  ]

  return (
    <div className="space-y-5">
      {/* Geri */}
      <Link
        href="/dashboard/projects"
        className="inline-flex items-center gap-1 text-[13px] text-[#6e6e73] hover:text-[#1c1c1c] transition-colors cursor-pointer"
      >
        <ChevronLeft className="w-3.5 h-3.5" /> Projelerim
      </Link>

      {/* Başlık kartı */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-[0.12em] mb-1">
              {project.application.period.title}
            </p>
            <h1 className="text-[17px] font-semibold text-[#1c1c1c] leading-snug">
              {project.application.title}
            </h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${colors.badge}`}>
              {label}
            </span>
            <span className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${project.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${project.status === "ACTIVE" ? "bg-emerald-500" : "bg-slate-400"}`} />
              {project.status === "ACTIVE" ? "Aktif" : "Kapandı"}
            </span>
          </div>
        </div>

        {/* Destek özeti — renkli çubuk */}
        <div className={`mt-4 pt-4 border-t border-black/[0.05]`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-2 h-8 rounded-full ${colors.bar}`} />
            <div>
              <p className="text-[13px] font-semibold text-[#1c1c1c]">{label}</p>
              <p className="text-[12px] text-[#6e6e73]">{desc}</p>
            </div>
            {project.supportEndDate && (
              <div className="ml-auto text-right shrink-0">
                <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-wider flex items-center gap-1 justify-end">
                  <Calendar className="w-3 h-3" /> Destek Bitişi
                </p>
                <p className="text-[13px] font-semibold text-[#1c1c1c] mt-0.5">
                  {fmt(project.supportEndDate)}
                </p>
              </div>
            )}
          </div>
        </div>

        {project.decision.notes && (
          <p className="mt-3 text-[12px] text-[#6e6e73] leading-relaxed bg-[#f9f9f9] rounded-xl px-3.5 py-2.5">
            {project.decision.notes}
          </p>
        )}
      </div>

      {/* Ana içerik: 2 kolon */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Sol — Ana içerik */}
        <div className="lg:col-span-2 space-y-4">

          {/* Proje Dosyaları */}
          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-black/[0.05] flex items-center gap-2">
              <FolderOpen className="w-3.5 h-3.5 text-[#aeaeb2]" />
              <p className="text-[12px] font-semibold text-[#1c1c1c]">
                Proje Dosyaları
              </p>
              {project.files.length > 0 && (
                <span className="ml-1 text-[#aeaeb2] text-[12px] font-normal">{project.files.length} dosya</span>
              )}
            </div>

            {project.files.length === 0 ? (
              <div className="px-5 py-6 text-center">
                <FolderOpen className="w-6 h-6 text-[#d1d1d6] mx-auto mb-2" />
                <p className="text-[13px] text-[#aeaeb2]">Henüz proje dosyası yüklenmedi.</p>
                <p className="text-[11px] text-[#c7c7cc] mt-0.5">
                  Proje çıktılarınızı, sunumlarınızı ve belgelerinizi buraya yükleyin.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-black/[0.04]">
                {project.files.map((f) => (
                  <li key={f.id} className="flex items-center gap-3 px-5 sm:px-6 py-3.5 hover:bg-[#fafafa] transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-[#f5f5f5] border border-black/[0.05] flex items-center justify-center shrink-0">
                      <FileText className="w-3.5 h-3.5 text-[#aeaeb2]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[#1c1c1c] truncate">{f.name}</p>
                      <p className="text-[11px] text-[#aeaeb2]">{formatSize(f.size)}</p>
                    </div>
                    <a
                      href={`/api/files/${f.id}`} target="_blank" rel="noreferrer"
                      className="ml-2 shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-[#6e6e73] hover:text-[#1c1c1c] hover:bg-[#f0f0f0] rounded-lg transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> İndir
                    </a>
                  </li>
                ))}
              </ul>
            )}

            {!isLocked && (
              <div className="px-5 sm:px-6 py-4 border-t border-black/[0.04] bg-[#fafafa]">
                <p className="text-[11px] font-semibold text-[#aeaeb2] uppercase tracking-wider mb-3">
                  Dosya Yükle
                </p>
                <ProjectFileUpload projectId={project.id} />
              </div>
            )}
          </div>

          {/* İlerleme Raporları */}
          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-black/[0.05] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-3.5 h-3.5 text-[#aeaeb2]" />
                <p className="text-[12px] font-semibold text-[#1c1c1c]">İlerleme Raporları</p>
              </div>
              <span className="text-[11px] text-[#aeaeb2]">{project.reports.length} rapor</span>
            </div>

            {project.reports.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <Send className="w-5 h-5 text-[#d1d1d6] mx-auto mb-2" />
                <p className="text-[13px] text-[#aeaeb2]">Henüz rapor gönderilmedi.</p>
                <p className="text-[11px] text-[#c7c7cc] mt-0.5">
                  Proje ilerlemesini aşağıdan paylaşın.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-black/[0.04]">
                {project.reports.map((r, i) => (
                  <li key={r.id} className="px-5 sm:px-6 py-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <p className="text-[11px] font-semibold text-[#aeaeb2] uppercase tracking-wider">
                        Rapor #{project.reports.length - i}
                      </p>
                      <span className="text-[11px] text-[#aeaeb2]">·</span>
                      <p className="text-[11px] text-[#aeaeb2]">{fmt(r.createdAt)}</p>
                    </div>
                    <p className="text-[13px] text-[#1c1c1c] leading-relaxed whitespace-pre-wrap pl-5">
                      {r.content}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            {/* Rapor gönder */}
            {!isLocked && (
              <div className="px-5 sm:px-6 py-5 border-t border-black/[0.04] bg-[#fafafa] space-y-3">
                <div>
                  <p className="text-[12px] font-semibold text-[#1c1c1c]">Yeni İlerleme Raporu</p>
                  <p className="text-[11px] text-[#6e6e73] mt-0.5">
                    Bu dönemde ne yaptınız? Karşılaştığınız zorluklar ve bir sonraki adımlarınızı paylaşın.
                  </p>
                </div>
                <ProjectReportForm applicationId={applicationId} />
              </div>
            )}

            {isLocked && (
              <div className="px-5 py-3.5 border-t border-black/[0.04] flex items-center gap-2 bg-[#fafafa]">
                <Clock className="w-3.5 h-3.5 text-[#aeaeb2]" />
                <p className="text-[12px] text-[#6e6e73]">Proje kapandı. Yeni rapor gönderilemez.</p>
              </div>
            )}
          </div>

          {/* Başvuru Belgeleri (arşiv, daraltılabilir) */}
          {project.application.files.length > 0 && (
            <details className="group bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] overflow-hidden">
              <summary className="flex items-center justify-between px-5 sm:px-6 py-4 cursor-pointer select-none hover:bg-[#fafafa] transition-colors">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-[#aeaeb2]" />
                  <span className="text-[12px] font-semibold text-[#1c1c1c]">
                    Başvuru Belgeleri
                  </span>
                  <span className="text-[#aeaeb2] text-[12px] font-normal">
                    {project.application.files.length} dosya
                  </span>
                </div>
                <span className="text-[11px] text-[#aeaeb2] group-open:hidden">Göster</span>
                <span className="text-[11px] text-[#aeaeb2] hidden group-open:block">Gizle</span>
              </summary>
              <ul className="divide-y divide-black/[0.04] border-t border-black/[0.04]">
                {project.application.files.map((f) => (
                  <li key={f.id} className="flex items-center justify-between px-5 sm:px-6 py-3 hover:bg-[#fafafa] transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-3.5 h-3.5 text-[#aeaeb2] shrink-0" />
                      <span className="text-[13px] text-[#1c1c1c] truncate">{f.name}</span>
                      <span className="text-[11px] text-[#aeaeb2] shrink-0">{formatSize(f.size)}</span>
                    </div>
                    <a href={`/api/files/${f.id}`} target="_blank" rel="noreferrer"
                      className="ml-3 shrink-0 text-[12px] font-medium text-[#6e6e73] hover:text-[#1c1c1c] transition-colors cursor-pointer">
                      İndir
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>

        {/* Sağ — Süreç + Bilgiler */}
        <div className="space-y-4">

          {/* Destek süresi geri sayımı */}
          {showSupportEnd && (
            <CountdownTimer targetDate={project.supportEndDate!} label="Destek Süresi Bitişine" />
          )}

          {/* Proje süreç adımları */}
          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] p-5">
            <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-[0.12em] mb-4">
              Proje Süreci
            </p>
            <div className="relative">
              <div className="absolute left-[13px] top-3 bottom-3 w-px bg-black/[0.06]" />
              <div className="space-y-1">
                {steps.map((step) => (
                  <div key={step.id} className="flex items-start gap-3 py-2 relative z-10">
                    <div className={`w-[26px] h-[26px] rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      step.done
                        ? "bg-[#1c1c1c] border-[#1c1c1c] text-white"
                        : step.active
                        ? "bg-[#fab758] border-[#fab758] text-white shadow-[0_0_0_3px_rgba(250,183,88,0.2)]"
                        : "bg-white border-[#e5e5e5] text-[#d1d1d6]"
                    }`}>
                      {step.done ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : step.active ? (
                        <Clock className="w-3 h-3" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      )}
                    </div>
                    <div className="pt-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className={`text-[12px] transition-colors ${
                          step.done || step.active ? "font-semibold text-[#1c1c1c]" : "text-[#aeaeb2]"
                        }`}>
                          {step.label}
                        </p>
                        {step.active && (
                          <span className="text-[9px] font-semibold bg-[#fab758]/10 text-[#fab758] px-1.5 py-0.5 rounded-full">
                            Aktif
                          </span>
                        )}
                      </div>
                      <p className={`text-[11px] mt-0.5 ${
                        step.done || step.active ? "text-[#6e6e73]" : "text-[#c7c7cc]"
                      }`}>
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Destek kapsamı özeti */}
          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] p-4 space-y-3">
            <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-[0.12em]">
              Destek Özeti
            </p>
            <div className="flex items-center gap-2.5">
              <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
              <span className="text-[13px] font-semibold text-[#1c1c1c]">{label}</span>
            </div>
            <p className="text-[12px] text-[#6e6e73] leading-relaxed">{desc}</p>
            <div className="pt-2 border-t border-black/[0.05] space-y-1.5 text-[12px] text-[#6e6e73]">
              <div className="flex justify-between">
                <span>Karar tarihi</span>
                <span className="font-medium text-[#1c1c1c]">{fmt(project.decision.decidedAt)}</span>
              </div>
              {project.supportEndDate && (
                <div className="flex justify-between">
                  <span>Destek bitişi</span>
                  <span className="font-medium text-[#1c1c1c]">{fmt(project.supportEndDate)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Gönderilen rapor</span>
                <span className="font-medium text-[#1c1c1c]">{project.reports.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Proje dosyası</span>
                <span className="font-medium text-[#1c1c1c]">{project.files.length}</span>
              </div>
            </div>
          </div>

          {/* Kapanmak üzere uyarısı */}
          {project.supportEndDate && !isLocked &&
            (project.supportEndDate.getTime() - now) < 7 * 24 * 3_600_000 && (
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[12px] font-semibold text-amber-800">Destek süresi bitiyor</p>
                <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                  7 günden az süre kaldı. Raporlarınızı ve kapanış dosyalarınızı yükleyin.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

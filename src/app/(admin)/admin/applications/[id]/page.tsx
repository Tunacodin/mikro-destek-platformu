import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, FileText, Download, Calendar } from "lucide-react"
import { JuryAssignPanel } from "@/components/admin/JuryAssignPanel"
import { ApplicationDecisionButtons } from "@/components/admin/ApplicationDecisionButtons"
import { ProcessTracker } from "@/components/ui/ProcessTracker"
import type { ApplicationStatus } from "@prisma/client"

export const metadata = { title: "Başvuru Detayı — Mikro Destek Fonu" }

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  DRAFT: "Taslak", SUBMITTED: "Gönderildi", IN_REVIEW: "İncelemede",
  EVALUATED: "Değerlendirildi", SUPPORTED: "Desteklendi", REJECTED: "Reddedildi",
}
const STATUS_STYLES: Record<ApplicationStatus, string> = {
  DRAFT:     "bg-slate-100 text-slate-600",
  SUBMITTED: "bg-blue-50 text-blue-700",
  IN_REVIEW: "bg-amber-50 text-amber-700",
  EVALUATED: "bg-purple-50 text-purple-700",
  SUPPORTED: "bg-emerald-50 text-emerald-700",
  REJECTED:  "bg-red-50 text-red-600",
}

const CRITERIA_LABELS: Record<string, string> = {
  innovation:    "Yenilikçilik",
  impact:        "Etki Potansiyeli",
  feasibility:   "Uygulanabilirlik",
  team:          "Ekip Yetkinliği",
  sustainability:"Sürdürülebilirlik",
}

const SCORE_BANDS = [
  { max: 2.0, label: "Desteklenemez",        bar: "bg-red-400",     text: "text-red-600",     bg: "bg-red-50" },
  { max: 3.0, label: "Sınırlı Destek",       bar: "bg-orange-400",  text: "text-orange-600",  bg: "bg-orange-50" },
  { max: 4.0, label: "Genişletilmiş Destek", bar: "bg-[#fab758]",   text: "text-amber-600",   bg: "bg-amber-50" },
  { max: 5.1, label: "Öncelikli Destek",     bar: "bg-emerald-400", text: "text-emerald-600", bg: "bg-emerald-50" },
]

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default async function AdminApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") redirect("/login")

  const { id } = await params

  const [application, juryMembers] = await Promise.all([
    prisma.application.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        period: { select: { title: true, endDate: true } },
        files: { select: { id: true, name: true, size: true, mimeType: true } },
        juryAssignments: { include: { jury: { select: { id: true, name: true, email: true } } } },
        evaluation: { include: { scores: true, jury: { select: { name: true, email: true } } } },
        project: { select: { supportEndDate: true, status: true } },
        decision: { select: { scope: true, notes: true, decidedAt: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: "JURY" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ])

  if (!application) notFound()

  const fmt = (d: Date) =>
    new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })

  const avgScore =
    application.evaluation?.scores.length
      ? application.evaluation.scores.reduce((s, e) => s + e.score, 0) /
        application.evaluation.scores.length
      : null

  const band = avgScore !== null
    ? SCORE_BANDS.find((b) => avgScore < b.max) ?? SCORE_BANDS[3]
    : null

  return (
    <div className="space-y-5">
      {/* Geri */}
      <Link
        href="/admin/applications"
        className="inline-flex items-center gap-1 text-[13px] text-[#6e6e73] hover:text-[#1c1c1c] transition-colors cursor-pointer"
      >
        <ChevronLeft className="w-3.5 h-3.5" /> Başvurular
      </Link>

      {/* Başlık kartı */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-[17px] font-semibold text-[#1c1c1c] leading-snug">{application.title}</h1>
            <p className="text-[12px] text-[#6e6e73] mt-1.5">
              {application.user.name ?? application.user.email}
              <span className="mx-1.5 text-[#d1d1d6]">·</span>
              {application.period.title}
              <span className="mx-1.5 text-[#d1d1d6]">·</span>
              Bitiş: {fmt(application.period.endDate)}
            </p>
          </div>
          <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[application.status]}`}>
            {STATUS_LABELS[application.status]}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Sol — Detaylar */}
        <div className="lg:col-span-2 space-y-4">

          {/* Proje Açıklaması */}
          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] p-5 sm:p-6">
            <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-[0.12em] mb-3">
              Proje Açıklaması
            </p>
            <p className="text-[14px] text-[#1c1c1c] whitespace-pre-wrap leading-relaxed">
              {application.description}
            </p>
          </div>

          {/* Belgeler */}
          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-black/[0.05]">
              <p className="text-[12px] font-semibold text-[#1c1c1c]">
                Belgeler
                {application.files.length > 0 && (
                  <span className="ml-2 text-[#aeaeb2] font-normal">{application.files.length} dosya</span>
                )}
              </p>
            </div>
            {application.files.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-[13px] text-[#aeaeb2]">Belge yüklenmemiş.</p>
              </div>
            ) : (
              <ul className="divide-y divide-black/[0.04]">
                {application.files.map((f) => (
                  <li key={f.id} className="flex items-center gap-3 px-5 sm:px-6 py-3.5 hover:bg-[#fafafa] transition-colors">
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
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Değerlendirme */}
          {application.evaluation && (
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-[0.12em]">
                  Değerlendirme
                </p>
                <p className="text-[12px] text-[#6e6e73]">
                  {application.evaluation.jury.name ?? application.evaluation.jury.email}
                </p>
              </div>

              {band && avgScore !== null && (
                <div className={`${band.bg} rounded-xl px-4 py-3 space-y-2`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-[13px] font-semibold ${band.text}`}>{band.label}</span>
                    <span className="text-[12px] text-[#6e6e73] tabular-nums">{avgScore.toFixed(2)} / 5</span>
                  </div>
                  <div className="h-1.5 bg-black/[0.08] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${band.bar}`}
                      style={{ width: `${Math.round((avgScore / 5) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {application.evaluation.scores.map((s) => (
                  <div key={s.id} className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-semibold text-[#1c1c1c]">
                        {CRITERIA_LABELS[s.criteria] ?? s.criteria}
                      </p>
                      <span className="text-[12px] font-semibold text-[#6e6e73] tabular-nums">{s.score}/5</span>
                    </div>
                    <p className="text-[12px] text-[#6e6e73] leading-relaxed">{s.justification}</p>
                  </div>
                ))}
              </div>

              {application.evaluation.comment && (
                <div className="pt-4 border-t border-black/[0.05] space-y-1">
                  <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-[0.1em]">Genel Yorum</p>
                  <p className="text-[13px] text-[#1c1c1c] leading-relaxed">{application.evaluation.comment}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sağ — Karar + Jüri Atama */}
        <div className="space-y-4">
          {/* Süreç Takipçisi */}
          <ProcessTracker
            status={application.status}
            hasJury={application.juryAssignments.length > 0}
            hasEvaluation={!!application.evaluation}
          />

          {/* Jüri Sunum Tarihi */}
          {application.presentationDate && (
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] p-4">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-3.5 h-3.5 text-[#fab758]" />
                <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-wider">Jüri Sunum Tarihi</p>
              </div>
              <p className="text-[13px] font-semibold text-[#1c1c1c]">
                {new Date(application.presentationDate).toLocaleString("tr-TR", {
                  day: "numeric", month: "long", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              </p>
            </div>
          )}

          {/* Destek Kararı */}
          {application.decision && (
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] p-4 space-y-2">
              <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-wider">Destek Kararı</p>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-[#1c1c1c]">{application.decision.scope}</span>
                <span className="text-[11px] text-[#6e6e73]">
                  {new Date(application.decision.decidedAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
              {application.project?.supportEndDate && (
                <div className="flex items-center gap-1.5 text-[11px] text-[#6e6e73]">
                  <Calendar className="w-3 h-3" />
                  Bitiş: {new Date(application.project.supportEndDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                </div>
              )}
              {application.decision.notes && (
                <p className="text-[12px] text-[#6e6e73] leading-relaxed border-t border-black/[0.05] pt-2">{application.decision.notes}</p>
              )}
            </div>
          )}

          <ApplicationDecisionButtons
            applicationId={application.id}
            status={application.status}
          />
          <JuryAssignPanel
            applicationId={application.id}
            applicationStatus={application.status}
            assignedJuries={application.juryAssignments.map((a) => a.jury)}
            allJuries={juryMembers}
          />
        </div>
      </div>
    </div>
  )
}

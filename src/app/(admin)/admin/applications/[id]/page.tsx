import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Calendar, FileText, Users, ClipboardList, Printer } from "lucide-react"
import { JuryAssignPanel } from "@/components/admin/JuryAssignPanel"
import { ApplicationDecisionButtons } from "@/components/admin/ApplicationDecisionButtons"
import { LockEvaluationsButton } from "@/components/admin/LockEvaluationsButton"
import { EditGrantButton } from "@/components/admin/EditGrantButton"
import { PresentationDateCard } from "@/components/admin/PresentationDateCard"
import { ProcessTracker } from "@/components/ui/ProcessTracker"
import { ApplicationDetailTabs } from "@/components/application/ApplicationDetailTabs"
import { JuryEvaluationTabs } from "@/components/admin/JuryEvaluationTabs"
import type { ApplicationStatus } from "@prisma/client"

export const metadata = { title: "Başvuru Detayı — Mikro Destek Fonu" }

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  DRAFT: "Taslak", SUBMITTED: "Gönderildi", IN_REVIEW: "Ön İnceleme Sürecinde",
  EVALUATED: "Jüri Değerlendirme Sürecinde", SUPPORTED: "Desteklendi", REJECTED: "Reddedildi",
}
const STATUS_STYLES: Record<ApplicationStatus, string> = {
  DRAFT:     "bg-slate-100 text-slate-600",
  SUBMITTED: "bg-blue-50 text-blue-700",
  IN_REVIEW: "bg-amber-50 text-amber-700",
  EVALUATED: "bg-purple-50 text-purple-700",
  SUPPORTED: "bg-emerald-50 text-emerald-700",
  REJECTED:  "bg-red-50 text-red-600",
}
const STATUS_DOT: Record<ApplicationStatus, string> = {
  DRAFT:     "bg-slate-400",
  SUBMITTED: "bg-blue-500",
  IN_REVIEW: "bg-amber-400",
  EVALUATED: "bg-purple-500",
  SUPPORTED: "bg-emerald-500",
  REJECTED:  "bg-red-500",
}

const CRITERIA_LABELS: Record<string, string> = {
  innovation:  "Yenilikçilik ve Özgünlük",
  feasibility: "Uygulanabilirlik ve Olgunluk",
  community:   "Topluluk Katkısı",
  ecosystem:   "Ekosistem ve Toplumsal Etki",
  resource:    "Kaynak Uygunluğu ve Verimlilik",
  output:      "Çıktı ve Sonuç Potansiyeli",
  visibility:  "Görünürlük ve İtibar Katkısı",
  bonus:       "Bonus: Motivasyon & Sunum",
  // Eski kriterler (geriye uyumluluk)
  impact:        "Etki Potansiyeli",
  team:          "Ekip Yetkinliği",
  sustainability:"Sürdürülebilirlik",
}
const CRITERIA_ORDER = ["innovation", "feasibility", "community", "ecosystem", "resource", "output", "visibility", "bonus"]

const SCORE_BANDS = [
  { max: 23, label: "Desteklenemez",        bar: "bg-red-400",     text: "text-red-600",     bg: "bg-red-50",     border: "border-red-100" },
  { max: 27, label: "Sınırlı Destek",       bar: "bg-orange-400",  text: "text-orange-600",  bg: "bg-orange-50",  border: "border-orange-100" },
  { max: 31, label: "Genişletilmiş Destek", bar: "bg-[#fab758]",   text: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-100" },
  { max: 41, label: "Öncelikli Destek",     bar: "bg-emerald-400", text: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
]

function fmtLong(d: Date) {
  return new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
}
function fmtShort(d: Date) {
  return new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })
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
        user: {
          select: {
            name: true, email: true,
            phone: true, educationStatus: true, department: true,
            address: true, communityProfileUrl: true,
            linkedinUrl: true, twitterUrl: true,
          },
        },
        period:  { select: { title: true, endDate: true } },
        program: { select: { title: true, endDate: true } },
        files: { select: { id: true, name: true, size: true, mimeType: true, type: true, url: true } },
        juryAssignments: { include: { jury: { select: { id: true, name: true, email: true } } } },
        evaluations: { include: { scores: true, jury: { select: { id: true, name: true, email: true } } } },
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

  // Evaluation aggregations — toplam bazlı (35+5=40 üzerinden)
  const allScores = application.evaluations.flatMap((e) => e.scores)

  // Her jürinin toplam puanı → ortalaması
  const juryTotals = application.evaluations.map((ev) =>
    ev.scores.reduce((s, e) => s + e.score, 0)
  )
  const avgTotal = juryTotals.length
    ? juryTotals.reduce((a, b) => a + b, 0) / juryTotals.length
    : null
  const band = avgTotal !== null
    ? SCORE_BANDS.find((b) => avgTotal < b.max) ?? SCORE_BANDS[3]
    : null

  // Per-criterion averages across all juries
  const criteriaAvg: Record<string, number | null> = {}
  for (const criterion of CRITERIA_ORDER) {
    const vals = allScores.filter((s) => s.criteria === criterion).map((s) => s.score)
    criteriaAvg[criterion] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
  }

  return (
    <div className="space-y-5">

      {/* Geri navigasyon */}
      <Link
        href="/admin/applications"
        className="inline-flex items-center gap-1.5 text-[13px] text-[#6e6e73] hover:text-[#1c1c1c] transition-colors cursor-pointer"
      >
        <ChevronLeft className="w-3.5 h-3.5" /> Başvurular
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0 space-y-2">
            {/* Status + title */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[application.status]}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[application.status]}`} />
                {STATUS_LABELS[application.status]}
              </span>
            </div>
            <h1 className="text-[18px] sm:text-[20px] font-bold text-[#1c1c1c] leading-snug">
              {application.title}
            </h1>
            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#6e6e73]">
              <span className="font-medium text-[#1c1c1c]">{application.user.name ?? application.user.email}</span>
              <span className="text-[#d1d1d6]">·</span>
              <span>{application.period?.title ?? application.program?.title ?? "—"}</span>
              {(application.period ?? application.program) && (
                <>
                  <span className="text-[#d1d1d6]">·</span>
                  <span>Bitiş: {fmtShort((application.period ?? application.program)!.endDate)}</span>
                </>
              )}
              {application.submittedAt && (
                <>
                  <span className="text-[#d1d1d6]">·</span>
                  <span>Gönderildi: {fmtShort(application.submittedAt)}</span>
                </>
              )}
            </div>
            {/* Category tags */}
            {application.categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {application.categories.map((c) => (
                  <span key={c} className="text-[11px] font-medium bg-[#f0f0f0] text-[#6e6e73] px-2.5 py-1 rounded-full">
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div className="flex sm:flex-col gap-3 sm:gap-2 shrink-0 sm:text-right">
            <div className="flex items-center gap-1.5 text-[12px] text-[#6e6e73]">
              <FileText className="w-3.5 h-3.5 text-[#aeaeb2]" />
              <span>{application.files.length} belge</span>
            </div>
            <div className="flex items-center gap-1.5 text-[12px] text-[#6e6e73]">
              <Users className="w-3.5 h-3.5 text-[#aeaeb2]" />
              <span>{application.juryAssignments.length} jüri</span>
            </div>
            <div className="flex items-center gap-1.5 text-[12px] text-[#6e6e73]">
              <ClipboardList className="w-3.5 h-3.5 text-[#aeaeb2]" />
              <span>{application.evaluations.length} değerlendirme</span>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Sol: İçerik + Değerlendirmeler ── */}
        <div className="lg:col-span-2 space-y-4">

          <ApplicationDetailTabs
            application={{ ...application, supportNotes: application.supportNotes as Record<string, string> | null }}
            userProfile={application.user}
            files={application.files}
            showFileNotes
            showAuthor
          />

          {/* Değerlendirme bölümü */}
          {application.evaluations.length > 0 && (
            <JuryEvaluationTabs
              evaluations={application.evaluations}
              avgTotal={avgTotal}
              band={band}
              criteriaAvg={criteriaAvg}
            />
          )}
        </div>

        {/* ── Sağ: Sidebar ── */}
        <div className="space-y-4">

          {/* Süreç takipçisi */}
          <ProcessTracker
            status={application.status}
            hasJury={application.juryAssignments.length > 0}
            hasEvaluation={application.evaluations.length > 0}
          />

          {/* Jüri Sunum Tarihi */}
          <PresentationDateCard
            applicationId={application.id}
            status={application.status}
            presentationDate={application.presentationDate}
          />


          {/* Destek Kararı */}
          {application.decision && (
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] px-4 py-3.5 space-y-2">
              <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-wider">Destek Kararı</p>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-[#1c1c1c]">{application.decision.scope}</span>
                <span className="text-[11px] text-[#aeaeb2]">
                  {fmtShort(application.decision.decidedAt)}
                </span>
              </div>
              {application.project?.supportEndDate && (
                <div className="flex items-center gap-1.5 text-[11px] text-[#6e6e73]">
                  <Calendar className="w-3 h-3 text-[#aeaeb2]" />
                  Destek bitişi: {fmtLong(application.project.supportEndDate)}
                </div>
              )}
              {application.decision.notes && (
                <p className="text-[12px] text-[#6e6e73] leading-relaxed pt-2 border-t border-black/[0.05]">
                  {application.decision.notes}
                </p>
              )}
            </div>
          )}

          {/* Bildiri Yazdır */}
          {application.decision && (
            <Link
              href={`/admin/applications/${application.id}/decision-report`}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-white border border-black/[0.07] text-[#1c1c1c] text-[13px] font-semibold rounded-xl hover:bg-[#f4f4f4] transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#6e6e73]" />
              Bildiriyi Yazdır
            </Link>
          )}

          {/* Düzenleme yetkisi */}
          {(application.status === "SUBMITTED" || application.status === "IN_REVIEW" || application.status === "EVALUATED") && (
            <EditGrantButton
              applicationId={application.id}
              editGranted={application.editGranted}
            />
          )}

          {/* Aksiyon butonları */}
          <ApplicationDecisionButtons
            applicationId={application.id}
            status={application.status}
          />

          {/* Jüri Değerlendirme Kilidi — karar verilmediği sürece her zaman düzenlenebilir */}
          {!application.decision &&
            (application.status === "SUBMITTED" ||
              application.status === "IN_REVIEW" ||
              application.status === "EVALUATED") && (
            <LockEvaluationsButton
              applicationId={application.id}
              locked={application.evaluationsLocked}
            />
          )}

          {/* Jüri Ataması */}
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

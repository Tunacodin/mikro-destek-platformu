import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { ApplicationForm } from "@/components/application/ApplicationForm"
import { ApplicationEditForm } from "@/components/application/ApplicationEditForm"
import { ApplicationDetailTabs } from "@/components/application/ApplicationDetailTabs"
import { InlineCountdown } from "@/components/ui/InlineCountdown"
import { HorizontalProcess } from "@/components/ui/HorizontalProcess"
import { ChevronLeft, Lock, PencilLine, RotateCcw, Calendar, FileText, Layers } from "lucide-react"
import type { ApplicationStatus } from "@prisma/client"

export const metadata = { title: "Başvuru Detayı — Mikro Destek Fonu" }

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  DRAFT:     "Taslak",
  SUBMITTED: "Gönderildi",
  IN_REVIEW: "Ön İnceleme Sürecinde",
  EVALUATED: "Jüri Değerlendirme Sürecinde",
  SUPPORTED: "Desteklendi",
  REJECTED:  "Reddedildi",
}

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  DRAFT:     "bg-slate-100 text-slate-600",
  SUBMITTED: "bg-blue-50 text-blue-700",
  IN_REVIEW: "bg-amber-50 text-amber-700",
  EVALUATED: "bg-purple-50 text-purple-700",
  SUPPORTED: "bg-emerald-50 text-emerald-700",
  REJECTED:  "bg-red-50 text-red-600",
}

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
}

function fmtShort(d: Date) {
  return new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })
}

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session || session.user.role !== "APPLICANT") redirect("/login")

  const { id } = await params

  const [application, userProfile] = await Promise.all([
    prisma.application.findUnique({
      where: { id },
      include: {
        period:  { select: { id: true, title: true, endDate: true, status: true } },
        program: { select: { id: true, title: true, endDate: true, status: true } },
        files: {
          select: { id: true, name: true, size: true, mimeType: true },
          orderBy: { createdAt: "asc" },
        },
        juryAssignments: { select: { id: true } },
        _count: { select: { evaluations: true } },
        project: { select: { supportEndDate: true } },
      },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true, email: true,
        phone: true, educationStatus: true, department: true,
        address: true, communityProfileUrl: true,
        linkedinUrl: true, twitterUrl: true,
      },
    }),
  ])

  if (!application || application.userId !== session.user.id) notFound()

  const now = Date.now()
  const periodOrProgram = application.period ?? application.program
  const hoursLeft = periodOrProgram ? (periodOrProgram.endDate.getTime() - now) / 3_600_000 : Infinity
  const presentationHoursLeft = application.presentationDate
    ? (application.presentationDate.getTime() - now) / 3_600_000
    : Infinity
  const isLocked = hoursLeft < 48 || presentationHoursLeft < 48
  const isDraft = application.status === "DRAFT"
  const canEditByGrant = application.editGranted && !isLocked
  // Jüri sunum tarihi belirlenmişse ve 48 saatten fazla varsa otomatik düzenleme yetkisi
  const canEditByPresentation = !!application.presentationDate && presentationHoursLeft >= 48
  const hasJury = application.juryAssignments.length > 0
  const hasEvaluation = application._count.evaluations > 0
  const showPresentationDate = !!application.presentationDate && application.presentationDate.getTime() > now
  const showSupportEnd = !!application.project?.supportEndDate && application.project.supportEndDate.getTime() > now

  let activePeriods:  { id: string; title: string; endDate: Date }[] = []
  let activePrograms: { id: string; title: string; endDate: Date }[] = []
  if (isDraft) {
    ;[activePeriods, activePrograms] = await Promise.all([
      prisma.applicationPeriod.findMany({ where: { status: "ACTIVE" }, orderBy: { endDate: "asc" } }),
      prisma.program.findMany({ where: { status: "ACTIVE" }, orderBy: { endDate: "asc" } }),
    ])
  }

  return (
    <div className="space-y-6">

      {/* Geri navigasyon */}
      <Link
        href="/dashboard/applications"
        className="inline-flex items-center gap-1.5 text-[13px] text-[#6e6e73] hover:text-[#1c1c1c] transition-colors cursor-pointer"
      >
        <ChevronLeft className="w-3.5 h-3.5" /> Başvurularım
      </Link>

      {/* Header: Başlık sol — geri sayım/durum sağ */}
      <div className="pb-6 border-b border-[#e8e8e8]">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[application.status]}`}>
              {STATUS_LABELS[application.status]}
            </span>
            <h1 className="text-[22px] font-bold text-[#1c1c1c] tracking-tight leading-snug">
              {application.title}
            </h1>
            <div className="flex items-center gap-3 flex-wrap text-[12px] text-[#6e6e73]">
              {periodOrProgram && (
                <span className="inline-flex items-center gap-1">
                  <Layers className="w-3 h-3 text-[#aeaeb2]" /> {periodOrProgram.title}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <FileText className="w-3 h-3 text-[#aeaeb2]" /> {application.files.length} belge
              </span>
              {periodOrProgram && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#aeaeb2]" /> Bitiş: {fmtShort(periodOrProgram.endDate)}
                </span>
              )}
            </div>
          </div>

          {/* Sağ: geri sayım veya durum */}
          <div className="shrink-0">
            {showPresentationDate ? (
              <InlineCountdown targetDate={application.presentationDate!} label="Jüri Sunumuna" />
            ) : showSupportEnd ? (
              <InlineCountdown targetDate={application.project!.supportEndDate!} label="Destek Bitişine" />
            ) : null}
          </div>
        </div>

        {(isDraft && isLocked) && (
          <div className="mt-4 pt-4 border-t border-[#e8e8e8] flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-semibold text-red-600">Düzenleme yetkisi kapalı</p>
              <p className="text-[12px] text-red-500 mt-0.5">
                {presentationHoursLeft < 48
                  ? "Jüri sunumuna 48 saatten az kaldığı için düzenleme kapatıldı."
                  : "Dönem bitimine 48 saatten az kaldı."}
              </p>
            </div>
          </div>
        )}

        {!isDraft && isLocked && (canEditByGrant || canEditByPresentation) && (
          <div className="mt-4 pt-4 border-t border-[#e8e8e8] flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-semibold text-red-600">Düzenleme süresi doldu</p>
              <p className="text-[12px] text-red-500 mt-0.5">Jüri sunumuna 48 saatten az kaldığı için düzenleme kapatıldı.</p>
            </div>
          </div>
        )}

        {canEditByPresentation && (
          <div className="mt-4 pt-4 border-t border-[#e8e8e8] flex items-start gap-2.5">
            <PencilLine className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-semibold text-blue-700">Düzenleme açık</p>
              <p className="text-[12px] text-blue-600 mt-0.5">Jüri sunumuna 48 saat kalana dek başvurunuzu düzenleyebilirsiniz.</p>
            </div>
          </div>
        )}

        {canEditByGrant && !canEditByPresentation && (
          <div className="mt-4 pt-4 border-t border-[#e8e8e8] flex items-start gap-2.5">
            <PencilLine className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-semibold text-amber-700">Düzenleme yetkisi aktif</p>
              <p className="text-[12px] text-amber-600 mt-0.5">Admin tarafından başvurunuzu düzenlemenize izin verildi.</p>
            </div>
          </div>
        )}
      </div>

      {/* Yatay süreç çizgisi */}
      {!isDraft && (
        <HorizontalProcess status={application.status} hasJury={hasJury} hasEvaluation={hasEvaluation} />
      )}

      {/* Revize notu */}
      {isDraft && application.reviewNotes && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
          <RotateCcw className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] font-semibold text-amber-800">Revize Notu</p>
            <p className="text-[12px] text-amber-700 mt-0.5 leading-relaxed">{application.reviewNotes}</p>
          </div>
        </div>
      )}

      {/* İçerik */}
      {isDraft && !isLocked ? (
        <ApplicationForm
          periods={activePeriods}
          programs={activePrograms}
          userProfile={userProfile}
          existingApplication={{
            id: application.id,
            periodId:  application.periodId,
            programId: application.programId,
            title: application.title,
            teamName: application.teamName,
            teamInfo: application.teamInfo,
            summary: application.summary,
            targetAudience: application.targetAudience,
            projectFields: application.projectFields,
            categories: application.categories,
            technologyStage: application.technologyStage,
            artStage: application.artStage,
            researchStage: application.researchStage,
            problemStatement: application.problemStatement,
            solution: application.solution,
            innovation: application.innovation,
            outputs: application.outputs,
            timeline: application.timeline,
            successCriteria: application.successCriteria,
            ecosystemCollaboration: application.ecosystemCollaboration,
            communityContribution: application.communityContribution,
            divisionContribution: application.divisionContribution,
            supportTypes: application.supportTypes,
            supportNotes: application.supportNotes as Record<string, string> | null,
            files: application.files,
          }}
        />
      ) : (canEditByGrant || canEditByPresentation) ? (
        <ApplicationEditForm
          application={{
            id: application.id,
            title: application.title,
            teamName: application.teamName,
            teamInfo: application.teamInfo,
            summary: application.summary,
            targetAudience: application.targetAudience,
            projectFields: application.projectFields,
            categories: application.categories,
            technologyStage: application.technologyStage,
            artStage: application.artStage,
            researchStage: application.researchStage,
            problemStatement: application.problemStatement,
            solution: application.solution,
            innovation: application.innovation,
            outputs: application.outputs,
            timeline: application.timeline,
            successCriteria: application.successCriteria,
            ecosystemCollaboration: application.ecosystemCollaboration,
            communityContribution: application.communityContribution,
            divisionContribution: application.divisionContribution,
            supportTypes: application.supportTypes,
            supportNotes: application.supportNotes as Record<string, string> | null,
          }}
          userProfile={userProfile!}
          locked={false}
        />
      ) : isDraft && isLocked ? null : (
        <ApplicationDetailTabs
          application={{ ...application, supportNotes: application.supportNotes as Record<string, string> | null }}
          userProfile={userProfile}
          files={application.files}
        />
      )}
    </div>
  )
}

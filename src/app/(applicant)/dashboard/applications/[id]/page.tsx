import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { ApplicationEditForm } from "@/components/application/ApplicationEditForm"
import { SubmitApplicationButton } from "@/components/application/SubmitApplicationButton"
import { CountdownTimer } from "@/components/ui/CountdownTimer"
import { ProcessTracker } from "@/components/ui/ProcessTracker"
import { ChevronLeft, Download, FileText, AlertTriangle, Lock, RotateCcw } from "lucide-react"
import type { ApplicationStatus } from "@prisma/client"

export const metadata = { title: "Başvuru Detayı — Mikro Destek Fonu" }

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  DRAFT:     "Taslak",
  SUBMITTED: "Gönderildi",
  IN_REVIEW: "İncelemede",
  EVALUATED: "Değerlendirildi",
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

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session || session.user.role !== "APPLICANT") redirect("/login")

  const { id } = await params

  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      period: { select: { title: true, endDate: true, status: true } },
      files: {
        select: { id: true, name: true, size: true, mimeType: true },
        orderBy: { createdAt: "asc" },
      },
      juryAssignments: { select: { id: true } },
      evaluation: { select: { id: true } },
      project: { select: { supportEndDate: true } },
    },
  })

  if (!application || application.userId !== session.user.id) notFound()

  const now = Date.now()
  const hoursLeft = (application.period.endDate.getTime() - now) / 3_600_000
  const isLocked = hoursLeft < 48
  const isDraft = application.status === "DRAFT"
  const showCountdown = isDraft && application.period.status === "ACTIVE" && application.period.endDate.getTime() > now
  const hasJury = application.juryAssignments.length > 0
  const hasEvaluation = !!application.evaluation
  const showPresentationDate = !!application.presentationDate && application.presentationDate.getTime() > now
  const showSupportEnd = !!application.project?.supportEndDate && application.project.supportEndDate.getTime() > now

  const fmt = (d: Date) =>
    new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })

  return (
    <div className="space-y-4">

      {/* Geri navigasyon */}
      <Link
        href="/dashboard/applications"
        className="inline-flex items-center gap-1 text-[13px] text-[#6e6e73] hover:text-[#1c1c1c] transition-colors cursor-pointer"
      >
        <ChevronLeft className="w-3.5 h-3.5" /> Başvurularım
      </Link>

      {/* Başlık kartı */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-[17px] font-semibold text-[#1c1c1c] leading-snug">{application.title}</h1>
            <p className="text-[12px] text-[#6e6e73] mt-1.5">
              {application.period.title} · Bitiş: {fmt(application.period.endDate)}
            </p>
          </div>
          <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[application.status]}`}>
            {STATUS_LABELS[application.status]}
          </span>
        </div>

        {/* Kilitli uyarısı */}
        {isDraft && isLocked && (
          <div className="mt-4 pt-4 border-t border-black/[0.05] flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-semibold text-red-600">Düzenleme yetkisi kapalı</p>
              <p className="text-[12px] text-red-500 mt-0.5">
                Dönem bitimine 48 saatten az kaldı.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Süreç Takipçisi */}
      <ProcessTracker
        status={application.status}
        hasJury={hasJury}
        hasEvaluation={hasEvaluation}
      />

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

      {/* Dönem geri sayımı */}
      {showCountdown && (
        <CountdownTimer targetDate={application.period.endDate} label="Dönem Bitimine" />
      )}

      {/* Jüri sunum tarihi */}
      {showPresentationDate && (
        <CountdownTimer targetDate={application.presentationDate!} label="Jüri Sunumuna" />
      )}

      {/* Destek süresi bitişi */}
      {showSupportEnd && (
        <CountdownTimer targetDate={application.project!.supportEndDate!} label="Destek Süresi Bitişine" />
      )}

      {/* Proje açıklaması (sadece görüntüleme) */}
      {!isDraft && (
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] p-5 sm:p-6">
          <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-[0.12em] mb-3">
            Proje Açıklaması
          </p>
          <p className="text-[14px] text-[#1c1c1c] whitespace-pre-wrap leading-relaxed">
            {application.description}
          </p>
        </div>
      )}

      {/* Düzenleme formu (sadece DRAFT) */}
      {isDraft && (
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] p-5 sm:p-6">
          <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-[0.12em] mb-4">
            Başvuru Bilgileri
          </p>
          <ApplicationEditForm
            applicationId={application.id}
            initialTitle={application.title}
            initialDescription={application.description}
            locked={isLocked}
          />
        </div>
      )}

      {/* Belgeler */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-black/[0.05] flex items-center justify-between">
          <p className="text-[12px] font-semibold text-[#1c1c1c]">
            Belgeler
            {application.files.length > 0 && (
              <span className="ml-2 text-[#aeaeb2] font-normal">{application.files.length} dosya</span>
            )}
          </p>
        </div>

        {application.files.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <FileText className="w-6 h-6 text-[#d1d1d6] mx-auto mb-2" />
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

      {/* Gönder bölümü */}
      {isDraft && !isLocked && application.files.length > 0 && (
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] p-5 sm:p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#1c1c1c]">Başvuruyu Gönder</p>
              <p className="text-[12px] text-[#6e6e73] mt-0.5">
                Gönderildikten sonra başvurunuzu düzenleyemezsiniz. Bilgilerin doğru olduğundan emin olun.
              </p>
            </div>
          </div>
          <SubmitApplicationButton applicationId={application.id} />
        </div>
      )}

      {/* Dosya olmadan gönderim uyarısı */}
      {isDraft && !isLocked && application.files.length === 0 && (
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[13px] text-amber-700">
            Başvuruyu göndermeden önce en az bir belge yüklemeniz gerekiyor.
          </p>
        </div>
      )}
    </div>
  )
}

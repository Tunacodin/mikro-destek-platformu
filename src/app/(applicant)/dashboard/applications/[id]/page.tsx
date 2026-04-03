import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { ApplicationEditForm } from "@/components/application/ApplicationEditForm"
import { SubmitApplicationButton } from "@/components/application/SubmitApplicationButton"
import { CountdownTimer } from "@/components/ui/CountdownTimer"
import { ChevronLeft, Download } from "lucide-react"
import type { ApplicationStatus } from "@prisma/client"

export const metadata = { title: "Başvuru Detayı — Mikro Destek Fonu" }

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  DRAFT: "Taslak", SUBMITTED: "Gönderildi", IN_REVIEW: "İncelemede",
  EVALUATED: "Değerlendirildi", SUPPORTED: "Desteklendi", REJECTED: "Reddedildi",
}

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  DRAFT:     "bg-[#f0f0f0] text-[#6e6e73]",
  SUBMITTED: "bg-blue-50 text-blue-600",
  IN_REVIEW: "bg-amber-50 text-amber-600",
  EVALUATED: "bg-purple-50 text-purple-600",
  SUPPORTED: "bg-emerald-50 text-emerald-600",
  REJECTED:  "bg-red-50 text-red-500",
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
      files: { select: { id: true, name: true, size: true, mimeType: true }, orderBy: { createdAt: "asc" } },
    },
  })

  if (!application || application.userId !== session.user.id) notFound()

  const now = Date.now()
  const hoursLeft = (application.period.endDate.getTime() - now) / 3_600_000
  const isLocked = hoursLeft < 48
  const isDraft = application.status === "DRAFT"
  const showCountdown = isDraft && application.period.status === "ACTIVE" && application.period.endDate.getTime() > now

  const fmt = (d: Date) =>
    new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })

  return (
    <div className="max-w-2xl space-y-5">
      {/* Geri */}
      <Link href="/dashboard/applications" className="inline-flex items-center gap-1 text-[13px] text-[#6e6e73] hover:text-[#1c1c1c] transition-colors">
        <ChevronLeft className="w-3.5 h-3.5" /> Başvurularım
      </Link>

      {/* Başlık */}
      <div className="bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[17px] font-semibold text-[#1c1c1c] leading-snug">{application.title}</h1>
            <p className="text-[12px] text-[#6e6e73] mt-1">
              {application.period.title} · Bitiş: {fmt(application.period.endDate)}
            </p>
          </div>
          <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full mt-0.5 ${STATUS_STYLES[application.status]}`}>
            {STATUS_LABELS[application.status]}
          </span>
        </div>
      </div>

      {/* Geri sayım */}
      {showCountdown && (
        <CountdownTimer targetDate={application.period.endDate} label="Dönem Bitimine" />
      )}

      {/* Açıklama (sadece görüntüleme — DRAFT değil) */}
      {!isDraft && (
        <div className="bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 space-y-3">
          <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-[0.12em]">Proje Açıklaması</p>
          <p className="text-[14px] text-[#1c1c1c] whitespace-pre-wrap leading-relaxed">{application.description}</p>
        </div>
      )}

      {/* Düzenleme formu (sadece DRAFT) */}
      {isDraft && (
        <div className="bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 space-y-4">
          <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-[0.12em]">Başvuru Bilgileri</p>
          <ApplicationEditForm
            applicationId={application.id}
            initialTitle={application.title}
            initialDescription={application.description}
            locked={isLocked}
          />
        </div>
      )}

      {/* Belgeler */}
      <div className="bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="px-5 py-4 border-b border-black/[0.04]">
          <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-[0.12em]">
            Belgeler {application.files.length > 0 && `(${application.files.length})`}
          </p>
        </div>
        {application.files.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-[13px] text-[#aeaeb2]">Belge yüklenmemiş.</p>
          </div>
        ) : (
          <ul className="divide-y divide-black/[0.04]">
            {application.files.map((f) => (
              <li key={f.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-[#fafafa] transition-colors">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-[#1c1c1c] truncate">{f.name}</p>
                  <p className="text-[11px] text-[#aeaeb2] mt-0.5">{(f.size / 1024).toFixed(0)} KB</p>
                </div>
                <a href={`/api/files/${f.id}`} target="_blank" rel="noreferrer"
                  className="ml-4 shrink-0 inline-flex items-center gap-1 text-[12px] font-medium text-[#6e6e73] hover:text-[#1c1c1c] transition-colors">
                  <Download className="w-3.5 h-3.5" /> İndir
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Gönder */}
      {isDraft && !isLocked && application.files.length > 0 && (
        <div className="bg-amber-50 rounded-2xl p-4 space-y-3">
          <p className="text-[13px] text-amber-700 font-medium">
            Başvurunuzu gönderdikten sonra düzenleyemezsiniz. Bilgilerin doğru olduğundan emin olun.
          </p>
          <SubmitApplicationButton applicationId={application.id} />
        </div>
      )}
    </div>
  )
}

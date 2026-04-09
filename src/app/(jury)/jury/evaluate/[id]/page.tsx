import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { EvaluationForm } from "@/components/jury/EvaluationForm"
import { FileNotePanel } from "@/components/jury/FileNotePanel"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { EvaluateTabs } from "@/components/jury/EvaluateTabs"

export const metadata = { title: "Değerlendirme — Mikro Destek Fonu" }

export default async function JuryEvaluatePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session || session.user.role !== "JURY") redirect("/login")

  const { id } = await params
  const juryId = session.user.id

  const assignment = await prisma.juryAssignment.findUnique({
    where: { juryId_applicationId: { juryId, applicationId: id } },
  })
  if (!assignment) notFound()

  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
      period: { select: { title: true, endDate: true } },
      files: {
        select: { id: true, name: true, size: true, mimeType: true },
        orderBy: { createdAt: "asc" },
      },
      evaluation: { include: { scores: true } },
    },
  })
  if (!application) notFound()

  const canEvaluate = application.status === "IN_REVIEW"

  const filesPanel = (
    <div className="space-y-4">
      {/* Açıklama */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_4px_rgba(0,0,0,0.04)] p-5 space-y-2">
        <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-[0.12em]">
          Proje Açıklaması
        </p>
        <p className="text-[13px] text-[#1c1c1c] whitespace-pre-wrap leading-relaxed">
          {application.description}
        </p>
      </div>

      {/* Belgeler */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-black/[0.04]">
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
              <li key={f.id} className="px-5 py-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-[#1c1c1c] truncate">{f.name}</p>
                    <p className="text-[11px] text-[#aeaeb2] mt-0.5">{(f.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <a
                    href={`/api/files/${f.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-3 shrink-0 text-[12px] font-medium text-[#6e6e73] hover:text-[#1c1c1c] transition-colors"
                  >
                    Aç ↗
                  </a>
                </div>
                <FileNotePanel fileId={f.id} canEvaluate={canEvaluate} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )

  const evalPanel = (
    <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_4px_rgba(0,0,0,0.04)] p-5">
      <EvaluationForm
        applicationId={application.id}
        canEvaluate={canEvaluate}
        existingEvaluation={application.evaluation}
      />
    </div>
  )

  return (
    <div className="h-full flex flex-col">

      {/* Üst bar */}
      <div className="shrink-0 px-4 sm:px-6 py-3.5 bg-white border-b border-black/[0.06] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/jury/assignments"
            className="shrink-0 text-[#6e6e73] hover:text-[#1c1c1c] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-[14px] sm:text-[15px] font-semibold text-[#1c1c1c] truncate leading-tight">
              {application.title}
            </h1>
            <p className="text-[11px] text-[#6e6e73] mt-0.5 truncate">
              {application.user.name ?? application.user.email} · {application.period.title}
            </p>
          </div>
        </div>
        {canEvaluate ? (
          <span className="shrink-0 text-[11px] font-semibold bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full">
            İncelemede
          </span>
        ) : (
          <span className="shrink-0 text-[11px] font-semibold bg-purple-50 text-purple-600 px-2.5 py-1 rounded-full">
            Değerlendirildi
          </span>
        )}
      </div>

      {/* İçerik — mobil: tab'lı, desktop: split */}
      <EvaluateTabs filesPanel={filesPanel} evalPanel={evalPanel} />
    </div>
  )
}

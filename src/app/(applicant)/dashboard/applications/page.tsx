import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import {
  FilePlus, CheckCircle2, ArrowRight, Clock, Eye, Layers, Star, XCircle,
  FileText, Calendar, Send,
} from "lucide-react"
import type { ApplicationStatus } from "@prisma/client"

export const metadata = { title: "Başvurularım — Mikro Destek Fonu" }

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

const STATUS_ICON: Record<ApplicationStatus, React.ElementType> = {
  DRAFT:     Clock,
  SUBMITTED: Send,
  IN_REVIEW: Eye,
  EVALUATED: Star,
  SUPPORTED: CheckCircle2,
  REJECTED:  XCircle,
}

const STATUS_HINT: Record<ApplicationStatus, string> = {
  DRAFT:     "Başvurunuzu tamamlayıp gönderin",
  SUBMITTED: "Ön değerlendirme bekleniyor",
  IN_REVIEW: "Jüri değerlendirmesinde",
  EVALUATED: "Destek kararı bekleniyor",
  SUPPORTED: "Tebrikler! Projeniz desteklendi",
  REJECTED:  "Başvurunuz bu dönem kabul edilmedi",
}

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
}

function fmtShort(d: Date) {
  return new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })
}

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>
}) {
  const session = await auth()
  if (!session || session.user.role !== "APPLICANT") redirect("/login")

  const { submitted } = await searchParams

  const applications = await prisma.application.findMany({
    where: { userId: session.user.id },
    include: {
      period:  { select: { title: true, endDate: true } },
      program: { select: { title: true, endDate: true } },
      _count:  { select: { files: true, evaluations: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-8">
      {/* Başlık */}
      <div className="pb-6 border-b border-[#e8e8e8] flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#1c1c1c] tracking-tight">Başvurularım</h1>
          <p className="text-[14px] text-[#b0b0b0] mt-1">
            {applications.length === 0 ? "Henüz başvurunuz yok." : `${applications.length} başvuru`}
          </p>
        </div>
        <Link
          href="/dashboard/apply"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#1c1c1c] text-white text-[13px] font-semibold rounded-xl shadow-sm hover:bg-[#383838] hover:shadow transition-colors shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <FilePlus className="w-3.5 h-3.5" /> Yeni Başvuru
        </Link>
      </div>

      {/* Gönderim başarı bildirimi */}
      {submitted && (
        <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          <p className="text-[13px] font-medium text-emerald-700">
            Başvurunuz başarıyla gönderildi. Değerlendirme sürecini buradan takip edebilirsiniz.
          </p>
        </div>
      )}

      {/* Boş durum */}
      {applications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-14 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#f5f5f5] flex items-center justify-center mx-auto mb-4">
            <FilePlus className="w-6 h-6 text-[#aeaeb2]" />
          </div>
          <p className="text-[15px] font-semibold text-[#1c1c1c]">Henüz başvurunuz yok</p>
          <p className="text-[13px] text-[#6e6e73] mt-1.5 mb-5">
            Aktif bir dönemde başvurunuzu oluşturabilirsiniz.
          </p>
          <Link
            href="/dashboard/apply"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#1c1c1c] text-white text-[13px] font-semibold rounded-xl shadow-sm hover:bg-[#383838] hover:shadow transition-colors cursor-pointer"
          >
            <FilePlus className="w-3.5 h-3.5" /> Başvuru Yap
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {applications.map((app) => {
            const Icon = STATUS_ICON[app.status]
            const periodOrProgram = app.period ?? app.program
            const daysLeft = periodOrProgram
              ? Math.ceil((new Date(periodOrProgram.endDate).getTime() - Date.now()) / 86_400_000)
              : 0
            const isDraft = app.status === "DRAFT"
            const urgent = isDraft && daysLeft > 0 && daysLeft <= 3

            return (
              <Link
                key={app.id}
                href={`/dashboard/applications/${app.id}`}
                className="group bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:border-black/[0.1] transition-all duration-200 cursor-pointer flex flex-col"
              >
                {/* Üst kısım */}
                <div className="p-5 flex-1 space-y-3">
                  {/* Durum + ok */}
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[app.status]}`}>
                      <Icon className="w-3 h-3" />
                      {STATUS_LABELS[app.status]}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#d1d1d6] group-hover:text-[#aeaeb2] transition-colors" />
                  </div>

                  {/* Başlık */}
                  <div>
                    <p className="text-[15px] font-semibold text-[#1c1c1c] leading-snug line-clamp-2 group-hover:text-[#000]">
                      {app.title}
                    </p>
                    <p className="text-[12px] text-[#aeaeb2] mt-1">{STATUS_HINT[app.status]}</p>
                  </div>

                  {/* Özet bilgiler */}
                  {app.summary && (
                    <p className="text-[12px] text-[#6e6e73] leading-relaxed line-clamp-2">
                      {app.summary}
                    </p>
                  )}

                  {/* Kategoriler */}
                  {app.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {app.categories.map((c) => (
                        <span key={c} className="text-[10px] font-medium bg-[#f0f0f0] text-[#6e6e73] px-2 py-0.5 rounded-full">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Alt bilgi çizgisi */}
                <div className="px-5 py-3 border-t border-black/[0.04] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-[11px] text-[#aeaeb2] min-w-0">
                    {periodOrProgram && (
                      <span className="inline-flex items-center gap-1 shrink-0">
                        <Layers className="w-3 h-3" /> {periodOrProgram.title}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 shrink-0">
                      <FileText className="w-3 h-3" /> {app._count.files}
                    </span>
                    {periodOrProgram && (
                      <span className="inline-flex items-center gap-1 shrink-0">
                        <Calendar className="w-3 h-3" /> {fmtShort(periodOrProgram.endDate)}
                      </span>
                    )}
                  </div>
                  {urgent && (
                    <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full shrink-0">
                      {daysLeft} gün kaldı
                    </span>
                  )}
                </div>

                {/* Taslak CTA */}
                {isDraft && (
                  <div className="px-5 py-3 border-t border-black/[0.04] bg-[#fafafa] rounded-b-2xl">
                    <span className="text-[12px] font-semibold text-[#1c1c1c] flex items-center gap-1.5">
                      Düzenle ve Gönder <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

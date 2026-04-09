import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { FilePlus, CheckCircle2, ArrowRight, Clock, Eye, Layers, Star, XCircle } from "lucide-react"
import type { ApplicationStatus } from "@prisma/client"

export const metadata = { title: "Başvurularım — Mikro Destek Fonu" }

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

const STATUS_LEFT: Record<ApplicationStatus, string> = {
  DRAFT:     "border-l-slate-300",
  SUBMITTED: "border-l-blue-400",
  IN_REVIEW: "border-l-[#fab758]",
  EVALUATED: "border-l-purple-400",
  SUPPORTED: "border-l-emerald-500",
  REJECTED:  "border-l-red-400",
}

const STATUS_ICON: Record<ApplicationStatus, React.ElementType> = {
  DRAFT:     Clock,
  SUBMITTED: Eye,
  IN_REVIEW: Layers,
  EVALUATED: Star,
  SUPPORTED: CheckCircle2,
  REJECTED:  XCircle,
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
      period: { select: { title: true, endDate: true } },
      _count: { select: { files: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const fmt = (d: Date) =>
    new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-black/[0.06]">
        <div>
          <p className="text-[11px] font-semibold text-[#aeaeb2] uppercase tracking-widest mb-2">
            Komünite Üyesi
          </p>
          <h1 className="text-[22px] sm:text-[26px] font-semibold tracking-tight text-[#1c1c1c] leading-none">
            Başvurularım
          </h1>
          <p className="text-[13px] text-[#6e6e73] mt-2">
            {applications.length === 0 ? "Henüz başvurunuz yok." : `${applications.length} başvuru`}
          </p>
        </div>
        <Link
          href="/dashboard/apply"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#212121] text-white text-[13px] font-semibold rounded-xl hover:bg-[#2d2d2d] transition-colors shrink-0 self-start cursor-pointer"
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
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] p-14 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#f5f5f5] flex items-center justify-center mx-auto mb-4">
            <FilePlus className="w-6 h-6 text-[#aeaeb2]" />
          </div>
          <p className="text-[15px] font-semibold text-[#1c1c1c]">Henüz başvurunuz yok</p>
          <p className="text-[13px] text-[#6e6e73] mt-1.5 mb-5">
            Aktif bir dönemde başvurunuzu oluşturabilirsiniz.
          </p>
          <Link
            href="/dashboard/apply"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#212121] text-white text-[13px] font-semibold rounded-xl hover:bg-[#2d2d2d] transition-colors cursor-pointer"
          >
            <FilePlus className="w-3.5 h-3.5" /> Başvuru Yap
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {applications.map((app) => {
            const daysLeft = Math.ceil(
              (new Date(app.period.endDate).getTime() - Date.now()) / 86_400_000
            )
            const Icon = STATUS_ICON[app.status]
            return (
              <Link
                key={app.id}
                href={`/dashboard/applications/${app.id}`}
                className={`block bg-white rounded-2xl border-l-4 border border-black/[0.06] ${STATUS_LEFT[app.status]} shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_10px_rgba(0,0,0,0.07)] transition-all duration-200 cursor-pointer`}
              >
                <div className="px-5 py-4 flex items-center gap-4">
                  {/* Status icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${STATUS_STYLES[app.status]}`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[14px] font-semibold text-[#1c1c1c] truncate">{app.title}</p>
                      <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[app.status]}`}>
                        {STATUS_LABELS[app.status]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <p className="text-[11px] text-[#aeaeb2]">{app.period.title}</p>
                      <span className="w-1 h-1 rounded-full bg-[#d1d1d6]" />
                      <p className="text-[11px] text-[#aeaeb2]">{app._count.files} belge</p>
                      <span className="w-1 h-1 rounded-full bg-[#d1d1d6]" />
                      <p className="text-[11px] text-[#aeaeb2]">
                        Bitiş: {fmt(app.period.endDate)}
                      </p>
                      {app.status === "DRAFT" && daysLeft > 0 && daysLeft <= 3 && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-[#d1d1d6]" />
                          <span className="text-[11px] text-amber-600 font-semibold">{daysLeft} gün kaldı</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <ArrowRight className="w-4 h-4 text-[#d1d1d6] shrink-0" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

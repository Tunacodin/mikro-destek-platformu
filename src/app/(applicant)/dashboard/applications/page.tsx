import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import type { ApplicationStatus } from "@prisma/client"

export const metadata = { title: "Başvurularım — Mikro Destek Fonu" }

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
    <div className="space-y-7">
      {/* Başlık */}
      <div className="flex items-start justify-between gap-4 pb-6 border-b border-black/[0.06]">
        <div>
          <p className="text-[11px] font-semibold text-[#aeaeb2] uppercase tracking-widest mb-2">
            Başvuru Sahibi
          </p>
          <h1 className="text-[26px] font-semibold tracking-tight text-[#1c1c1c] leading-none">Başvurularım</h1>
          <p className="text-[13px] text-[#6e6e73] mt-2">{applications.length} başvuru</p>
        </div>
        <Link
          href="/dashboard/apply"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#212121] text-white text-[13px] font-semibold rounded-xl hover:opacity-80 transition-opacity shrink-0"
        >
          + Yeni Başvuru
        </Link>
      </div>

      {/* Gönderim başarı bildirimi */}
      {submitted && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-4">
          <p className="text-[13px] font-medium text-emerald-700">
            Başvurunuz başarıyla gönderildi. Değerlendirme sürecini buradan takip edebilirsiniz.
          </p>
        </div>
      )}

      {/* Boş durum */}
      {applications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] p-12 text-center space-y-3">
          <p className="text-[16px] font-semibold text-[#1c1c1c]">Henüz başvurunuz yok</p>
          <p className="text-[13px] text-[#6e6e73]">Aktif bir dönemde başvurunuzu oluşturabilirsiniz.</p>
          <Link
            href="/dashboard/apply"
            className="inline-flex items-center gap-1.5 mt-2 px-4 py-2.5 bg-[#212121] text-white text-[13px] font-semibold rounded-xl hover:opacity-80 transition-opacity"
          >
            Başvuru Yap
          </Link>
        </div>
      ) : (
        /* Liste */
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] overflow-hidden divide-y divide-black/[0.04]">
          {applications.map((app) => {
            const daysLeft = Math.ceil(
              (new Date(app.period.endDate).getTime() - Date.now()) / 86_400_000
            )
            return (
              <div key={app.id} className="px-6 py-5 hover:bg-[#fafafa] transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-1.5">
                    <p className="text-[14px] font-semibold text-[#1c1c1c] truncate">{app.title}</p>
                    <p className="text-[12px] text-[#6e6e73]">
                      {app.period.title} · {app._count.files} belge
                    </p>
                    <p className="text-[12px] text-[#aeaeb2]">
                      Dönem bitişi: {fmt(app.period.endDate)}
                      {app.status === "DRAFT" && daysLeft > 0 && daysLeft <= 3 && (
                        <span className="ml-2 text-amber-600 font-semibold">{daysLeft} gün kaldı</span>
                      )}
                    </p>
                  </div>
                  <span className={`shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-full ${STATUS_STYLES[app.status]}`}>
                    {STATUS_LABELS[app.status]}
                  </span>
                </div>

                {app.status === "DRAFT" && (
                  <div className="mt-3 pt-3 border-t border-black/[0.05]">
                    <Link
                      href={`/dashboard/applications/${app.id}`}
                      className="text-[13px] font-medium text-[#1c1c1c] hover:opacity-60 transition-opacity"
                    >
                      Düzenle ve Gönder →
                    </Link>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

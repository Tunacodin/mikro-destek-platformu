import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import type { ApplicationStatus } from "@prisma/client"

export const metadata = { title: "Başvurularım — Mikro Destek Fonu" }

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  DRAFT: "Taslak",
  SUBMITTED: "Gönderildi",
  IN_REVIEW: "İncelemede",
  EVALUATED: "Değerlendirildi",
  SUPPORTED: "Desteklendi",
  REJECTED: "Reddedildi",
}

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  SUBMITTED: "bg-blue-100 text-blue-700",
  IN_REVIEW: "bg-amber-100 text-amber-700",
  EVALUATED: "bg-purple-100 text-purple-700",
  SUPPORTED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
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
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Başvurularım</h1>
          <p className="text-sm text-muted-foreground mt-1">{applications.length} başvuru</p>
        </div>
        <Link
          href="/dashboard/apply"
          className="px-4 py-2 bg-[#212121] text-white text-sm font-medium rounded-lg hover:bg-[#fab758] hover:text-[#212121] transition-colors"
        >
          + Yeni Başvuru
        </Link>
      </div>

      {submitted && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg p-4">
          Başvurunuz başarıyla gönderildi. Değerlendirme sürecini buradan takip edebilirsiniz.
        </div>
      )}

      {applications.length === 0 ? (
        <div className="bg-white border rounded-lg p-10 text-center">
          <p className="font-medium">Henüz başvurunuz yok.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Aktif bir dönemde başvurunuzu oluşturabilirsiniz.
          </p>
          <Link
            href="/dashboard/apply"
            className="inline-block mt-4 px-4 py-2 bg-[#212121] text-white text-sm font-medium rounded-lg hover:bg-[#fab758] hover:text-[#212121] transition-colors"
          >
            Başvuru Yap
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => {
            const daysLeft = Math.ceil(
              (new Date(app.period.endDate).getTime() - Date.now()) / 86_400_000
            )

            return (
              <div key={app.id} className="bg-white border rounded-lg p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{app.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {app.period.title} · {app._count.files} belge
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Dönem bitiş: {fmt(app.period.endDate)}
                      {app.status === "DRAFT" && daysLeft > 0 && daysLeft <= 3 && (
                        <span className="ml-2 text-amber-600 font-medium">{daysLeft} gün kaldı!</span>
                      )}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[app.status]}`}>
                    {STATUS_LABELS[app.status]}
                  </span>
                </div>

                {app.status === "DRAFT" && (
                  <div className="mt-3">
                    <Link
                      href={`/dashboard/applications/${app.id}`}
                      className="text-sm text-[#212121] font-medium hover:text-[#fab758] transition-colors"
                    >
                      Düzenle ve gönder →
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

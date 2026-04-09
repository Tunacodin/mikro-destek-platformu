import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { CountdownTimer } from "@/components/ui/CountdownTimer"
import { ArrowRight, FilePlus, FileText } from "lucide-react"
import type { ApplicationStatus } from "@prisma/client"

export const metadata = { title: "Panelim — Mikro Destek Fonu" }

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

function getNextAction(status: ApplicationStatus, appId: string) {
  switch (status) {
    case "DRAFT":     return { label: "Düzenle ve Gönder", href: `/dashboard/applications/${appId}` }
    case "SUBMITTED": return { label: "Ön değerlendirme bekleniyor", href: null }
    case "IN_REVIEW": return { label: "Jüri değerlendirmesinde", href: null }
    case "EVALUATED": return { label: "Karar bekleniyor", href: null }
    case "SUPPORTED": return { label: "Proje takibine git", href: `/dashboard/projects/${appId}` }
    case "REJECTED":  return { label: "Başvurunuz kabul edilmedi", href: null }
  }
}

export default async function ApplicantDashboardPage() {
  const session = await auth()
  if (!session || session.user.role !== "APPLICANT") redirect("/login")

  const userId = session.user.id
  const [latestApp, totalApps] = await Promise.all([
    prisma.application.findFirst({
      where: { userId },
      include: { period: true, _count: { select: { files: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.application.count({ where: { userId } }),
  ])

  const now = Date.now()
  const showCountdown = latestApp?.status === "DRAFT"
    && latestApp.period.status === "ACTIVE"
    && latestApp.period.endDate.getTime() > now

  const hoursLeft = latestApp ? (latestApp.period.endDate.getTime() - now) / 3_600_000 : null
  const nextAction = latestApp ? getNextAction(latestApp.status, latestApp.id) : null
  const firstName = session.user.name?.split(" ")[0] ?? null

  const fmt = (d: Date) =>
    new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })

  return (
    <div className="space-y-6">
      {/* Karşılama + Hızlı Aksiyonlar */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-black/[0.06]">
        <div>
          <p className="text-[11px] font-semibold text-[#aeaeb2] uppercase tracking-widest mb-2">
            Komünite Üyesi
          </p>
          <h1 className="text-[22px] sm:text-[26px] font-semibold tracking-tight text-[#1c1c1c] leading-none">
            {firstName ? `Merhaba, ${firstName}` : "Merhaba"}
          </h1>
          <p className="text-[13px] text-[#6e6e73] mt-2">
            {totalApps === 0 ? "Henüz başvurunuz yok." : `${totalApps} başvuru · son durum aşağıda`}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link href="/dashboard/apply"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#212121] text-white text-[13px] font-semibold rounded-xl hover:bg-[#2d2d2d] transition-colors cursor-pointer">
            <FilePlus className="w-3.5 h-3.5" /> Yeni Başvuru
          </Link>
          <Link href="/dashboard/applications"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white text-[#1c1c1c] text-[13px] font-medium rounded-xl border border-black/[0.07] hover:bg-[#fafafa] transition-colors cursor-pointer">
            <FileText className="w-3.5 h-3.5" /> Başvurularım
          </Link>
        </div>
      </div>

      {/* Ana grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Son Başvuru Kartı — 2 kolon */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] p-6 space-y-5">
          <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-[0.12em]">Son Başvuru</p>

          {!latestApp ? (
            <div className="py-4 space-y-3">
              <p className="text-[14px] text-[#6e6e73]">Henüz başvurunuz yok.</p>
              <Link href="/dashboard/apply" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#1c1c1c] hover:opacity-60 transition-opacity">
                Başvuru Oluştur <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <p className="text-[17px] font-semibold text-[#1c1c1c] leading-snug">{latestApp.title}</p>
                <p className="text-[13px] text-[#6e6e73] mt-1.5">
                  {latestApp.period.title} · {latestApp._count.files} belge
                </p>
                <p className="text-[12px] text-[#aeaeb2] mt-0.5">Dönem bitişi: {fmt(latestApp.period.endDate)}</p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-black/[0.05]">
                <span className={`inline-flex text-[11px] font-semibold px-3 py-1.5 rounded-full ${STATUS_STYLES[latestApp.status]}`}>
                  {STATUS_LABELS[latestApp.status]}
                </span>

                {nextAction && (
                  nextAction.href ? (
                    <Link href={nextAction.href} className="flex items-center gap-1.5 text-[13px] font-medium text-[#1c1c1c] hover:opacity-60 transition-opacity">
                      {nextAction.label} <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <p className="text-[13px] text-[#6e6e73]">{nextAction.label}</p>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* Geri Sayım / Durum Kartı — 1 kolon */}
        <div className="space-y-3">
          {showCountdown && latestApp ? (
            <>
              <CountdownTimer targetDate={latestApp.period.endDate} label="Dönem Bitimine" />
              {hoursLeft !== null && hoursLeft < 48 && hoursLeft > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                  <p className="text-[13px] font-semibold text-red-600">Düzenleme yetkisi kapanıyor</p>
                  <p className="text-[12px] text-red-500 mt-0.5">48 saatten az kaldı. Başvurunuzu gönderin.</p>
                </div>
              )}
            </>
          ) : latestApp ? (
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] p-6">
              <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-[0.12em] mb-3">Süreç Durumu</p>
              <p className="text-[14px] text-[#1c1c1c] leading-relaxed">
                {latestApp.status === "SUPPORTED"
                  ? "Tebrikler! Başvurunuz desteklendi."
                  : latestApp.status === "REJECTED"
                  ? "Başvurunuz bu dönem kabul edilmedi."
                  : "Başvurunuz işlemde. Güncelleme geldiğinde bildirim alacaksınız."}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] p-6">
              <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-[0.12em] mb-3">Geri Sayım</p>
              <p className="text-[13px] text-[#aeaeb2]">Aktif başvurunuz olduğunda burada görünür.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

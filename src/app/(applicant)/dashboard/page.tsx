import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import {
  ArrowRight, FilePlus, FileText, FolderOpen, Clock,
  Send, Eye, Star, CheckCircle2, XCircle, Calendar,
} from "lucide-react"
import type { ApplicationStatus } from "@prisma/client"
import { PeriodHeroCountdown } from "@/components/ui/PeriodHeroCountdown"

export const metadata = { title: "Panelim — Mikro Destek Fonu" }

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
  IN_REVIEW: "Ön inceleme sürecinde",
  EVALUATED: "Jüri değerlendirme sürecinde",
  SUPPORTED: "Projeniz desteklendi!",
  REJECTED:  "Bu dönem kabul edilmedi",
}

function fmtShort(d: Date) {
  return new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })
}

export default async function ApplicantDashboardPage() {
  const session = await auth()
  if (!session || session.user.role !== "APPLICANT") redirect("/login")

  const userId = session.user.id

  const [applications, activePeriod, projectCount] = await Promise.all([
    prisma.application.findMany({
      where: { userId },
      include: {
        period:  { select: { title: true, endDate: true, status: true } },
        program: { select: { title: true, endDate: true, status: true } },
        _count: { select: { files: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.applicationPeriod.findFirst({
      where: { status: "ACTIVE" },
      orderBy: { endDate: "asc" },
    }),
    prisma.project.count({
      where: { application: { userId } },
    }),
  ])

  const totalApps = applications.length
  const drafts = applications.filter((a) => a.status === "DRAFT")
  const submitted = applications.filter((a) => a.status !== "DRAFT")
  const supported = applications.filter((a) => a.status === "SUPPORTED").length
  const firstName = session.user.name?.split(" ")[0] ?? null

  // Durum sayıları
  const statusCounts: Partial<Record<ApplicationStatus, number>> = {}
  for (const app of applications) {
    statusCounts[app.status] = (statusCounts[app.status] ?? 0) + 1
  }

  return (
    <div className="space-y-8">

      {/* Başlık */}
      <div className="pb-6 border-b border-[#e8e8e8] flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#1c1c1c] tracking-tight">
            {firstName ? `Merhaba, ${firstName}` : "Dashboard"}
          </h1>
          <p className="text-[14px] text-[#b0b0b0] mt-1">Başvuru ve proje süreçlerinizi buradan takip edin</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link href="/dashboard/apply"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#1c1c1c] text-white text-[13px] font-semibold rounded-xl shadow-sm hover:bg-[#383838] transition-colors cursor-pointer">
            <FilePlus className="w-3.5 h-3.5" /> Yeni Başvuru
          </Link>
        </div>
      </div>

      {/* Stat kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
          <div className="flex items-start justify-between">
            <p className="text-[13px] font-medium text-[#6e6e73]">Toplam Başvuru</p>
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <FileText className="w-4 h-4 text-blue-500" />
            </div>
          </div>
          <p className="text-[32px] font-bold text-[#1c1c1c] leading-none mt-3 tabular-nums">{totalApps}</p>
          <p className="text-[12px] text-[#aeaeb2] mt-1">tüm dönemler</p>
        </div>

        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
          <div className="flex items-start justify-between">
            <p className="text-[13px] font-medium text-[#6e6e73]">Taslak</p>
            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center">
              <Clock className="w-4 h-4 text-slate-400" />
            </div>
          </div>
          <p className="text-[32px] font-bold text-[#1c1c1c] leading-none mt-3 tabular-nums">{drafts.length}</p>
          <p className="text-[12px] text-[#aeaeb2] mt-1">tamamlanmayı bekliyor</p>
        </div>

        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
          <div className="flex items-start justify-between">
            <p className="text-[13px] font-medium text-[#6e6e73]">Desteklenen</p>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <p className="text-[32px] font-bold text-[#1c1c1c] leading-none mt-3 tabular-nums">{supported}</p>
          <p className="text-[12px] text-[#aeaeb2] mt-1">proje</p>
        </div>

        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
          <div className="flex items-start justify-between">
            <p className="text-[13px] font-medium text-[#6e6e73]">Aktif Proje</p>
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
              <FolderOpen className="w-4 h-4 text-purple-500" />
            </div>
          </div>
          <p className="text-[32px] font-bold text-[#1c1c1c] leading-none mt-3 tabular-nums">{projectCount}</p>
          <p className="text-[12px] text-[#aeaeb2] mt-1">takipte</p>
        </div>
      </div>

      {/* Alt grid: %50-%50 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Sol: Bekleyen İşlemler + Son Başvurular */}
        <div className="space-y-4">

          {/* Bekleyen İşlemler */}
          {drafts.length > 0 && (
            <div>
              <h2 className="text-[15px] font-semibold text-[#1c1c1c] mb-3">Bekleyen İşlemler</h2>
              <div className="space-y-2">
                {drafts.slice(0, 3).map((app) => (
                  <Link key={app.id} href={`/dashboard/applications/${app.id}`}
                    className="flex items-center justify-between bg-white rounded-xl border border-amber-100 px-4 py-3 hover:bg-amber-50/50 transition-colors cursor-pointer">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-[#1c1c1c] truncate">{app.title}</p>
                      <p className="text-[11px] text-amber-600 mt-0.5">{app._count.files} belge · tamamlanmayı bekliyor</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-2" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Son Başvurular */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-semibold text-[#1c1c1c]">Son Başvurularım</h2>
              <Link href="/dashboard/applications" className="text-[13px] font-medium text-[#fab758] hover:opacity-80 transition-all flex items-center gap-1">
                Tümünü Gör <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {applications.length === 0 ? (
              <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-10 text-center">
                <div className="w-10 h-10 rounded-2xl bg-[#f5f5f5] flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-5 h-5 text-[#d1d1d6]" />
                </div>
                <p className="text-[14px] font-medium text-[#1c1c1c]">Henüz başvurunuz yok</p>
                <p className="text-[12px] text-[#aeaeb2] mt-1 mb-4">Aktif dönemde başvuru oluşturabilirsiniz</p>
                <Link href="/dashboard/apply"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1c1c1c] text-white text-[12px] font-semibold rounded-xl hover:bg-[#383838] transition-colors cursor-pointer">
                  <FilePlus className="w-3.5 h-3.5" /> Başvuru Yap
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden divide-y divide-black/[0.04]">
                {applications.slice(0, 3).map((app) => {
                  const Icon = STATUS_ICON[app.status]
                  return (
                    <Link
                      key={app.id}
                      href={`/dashboard/applications/${app.id}`}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#fafafa] transition-colors cursor-pointer"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${STATUS_STYLES[app.status]}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-[#1c1c1c] truncate">{app.title}</p>
                        <p className="text-[11px] text-[#aeaeb2] mt-0.5">{app.period?.title ?? app.program?.title ?? "—"} · {app._count.files} belge</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-medium text-[#6e6e73]">{STATUS_LABELS[app.status]}</span>
                        <p className="text-[10px] text-[#aeaeb2] mt-0.5">{fmtShort(app.createdAt)}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sağ: Hızlı İşlemler + Aktif Dönem */}
        <div className="space-y-4">

          {/* Aktif Dönem */}
          {activePeriod ? (
            <PeriodHeroCountdown
              endDate={activePeriod.endDate.toISOString()}
              startDate={activePeriod.startDate.toISOString()}
              title={activePeriod.title}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
              <h2 className="text-[15px] font-semibold text-[#1c1c1c] mb-2">Aktif Dönem</h2>
              <p className="text-[13px] text-[#aeaeb2]">Şu an aktif başvuru dönemi yok. Yeni dönem açıldığında bildirim alacaksınız.</p>
            </div>
          )}


        </div>
      </div>
    </div>
  )
}

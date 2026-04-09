import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import type { ApplicationStatus } from "@prisma/client"
import {
  FileText,
  Clock,
  Layers,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"

export const metadata = { title: "Yönetim Paneli — Mikro Destek Fonu" }

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  DRAFT: "Taslak", SUBMITTED: "Gönderildi", IN_REVIEW: "İncelemede",
  EVALUATED: "Değerlendirildi", SUPPORTED: "Desteklendi", REJECTED: "Reddedildi",
}

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  DRAFT:     "bg-slate-100 text-slate-600",
  SUBMITTED: "bg-blue-50 text-blue-700",
  IN_REVIEW: "bg-amber-50 text-amber-700",
  EVALUATED: "bg-purple-50 text-purple-700",
  SUPPORTED: "bg-emerald-50 text-emerald-700",
  REJECTED:  "bg-red-50 text-red-600",
}

const STATUS_DOT: Record<ApplicationStatus, string> = {
  DRAFT:     "bg-slate-400",
  SUBMITTED: "bg-blue-500",
  IN_REVIEW: "bg-amber-500",
  EVALUATED: "bg-purple-500",
  SUPPORTED: "bg-emerald-500",
  REJECTED:  "bg-red-500",
}

export default async function AdminDashboardPage() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") redirect("/login")

  const now = new Date()

  const [statusCounts, activePeriod, recentApps, totalJury] = await Promise.all([
    prisma.application.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.applicationPeriod.findFirst({
      where: { status: "ACTIVE" },
      include: { _count: { select: { applications: true } } },
    }),
    prisma.application.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        period: { select: { title: true } },
      },
    }),
    prisma.user.count({ where: { role: "JURY" } }),
  ])

  const countMap = Object.fromEntries(
    statusCounts.map((s) => [s.status, s._count._all])
  ) as Partial<Record<ApplicationStatus, number>>

  const pending  = countMap.SUBMITTED ?? 0
  const inReview = countMap.IN_REVIEW ?? 0
  const evaluated = countMap.EVALUATED ?? 0
  const total    = Object.values(countMap).reduce((a, b) => a + b, 0)

  const daysLeft = activePeriod
    ? Math.max(0, Math.ceil((new Date(activePeriod.endDate).getTime() - now.getTime()) / 86_400_000))
    : null

  const fmt = (d: Date) =>
    new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })

  return (
    <div className="space-y-6 max-w-6xl">

      {/* Sayfa başlığı */}
      <div>
        <h1 className="text-[22px] font-bold text-[#1c1c1c] tracking-tight">Genel Bakış</h1>
        <p className="text-[13px] text-[#6e6e73] mt-0.5">
          Hoş geldiniz, {session.user.name ?? session.user.email}
        </p>
      </div>

      {/* Stat kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Toplam Başvuru",
            value: total,
            sub: "tüm dönemler",
            icon: FileText,
            highlight: false,
          },
          {
            label: "İnceleme Bekleyen",
            value: pending,
            sub: "aksiyon gerekiyor",
            icon: AlertCircle,
            highlight: pending > 0,
          },
          {
            label: "İncelemede",
            value: inReview,
            sub: "jüri değerlendiriyor",
            icon: Layers,
            highlight: false,
          },
          {
            label: "Jüri Üyesi",
            value: totalJury,
            sub: "kayıtlı",
            icon: Users,
            highlight: false,
          },
        ].map((s) => {
          const Icon = s.icon
          return (
            <div
              key={s.label}
              className={`bg-white rounded-2xl p-5 border shadow-[0_1px_6px_rgba(0,0,0,0.04)] ${
                s.highlight
                  ? "border-[#fab758]/40 shadow-[0_0_0_3px_rgba(250,183,88,0.07),0_1px_6px_rgba(0,0,0,0.04)]"
                  : "border-black/[0.06]"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[12px] font-medium text-[#6e6e73] leading-tight">{s.label}</p>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${s.highlight ? "bg-[#fab758]/10" : "bg-[#f5f5f5]"}`}>
                  <Icon className={`w-3.5 h-3.5 ${s.highlight ? "text-[#fab758]" : "text-[#aeaeb2]"}`} />
                </div>
              </div>
              <p className="text-[34px] font-bold text-[#1c1c1c] leading-none mt-3 tabular-nums tracking-tight">
                {s.value}
              </p>
              <p className="text-[11px] text-[#aeaeb2] mt-1.5">{s.sub}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sol kolon */}
        <div className="space-y-4">
          {/* Aktif dönem */}
          <div>
            <h2 className="text-[12px] font-semibold text-[#aeaeb2] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3" /> Aktif Dönem
            </h2>
            {activePeriod ? (
              <div className="bg-white border border-[#fab758]/30 rounded-2xl p-5 shadow-[0_0_0_3px_rgba(250,183,88,0.06)]">
                <p className="text-[14px] font-semibold text-[#1c1c1c]">{activePeriod.title}</p>
                <p className="text-[12px] text-[#6e6e73] mt-1">
                  {fmt(activePeriod.startDate)} — {fmt(activePeriod.endDate)}
                </p>
                <div className="mt-4 pt-4 border-t border-black/[0.05] flex items-end justify-between">
                  <div>
                    <p className="text-[36px] font-bold text-[#1c1c1c] leading-none tabular-nums">{daysLeft}</p>
                    <p className="text-[12px] text-[#6e6e73] mt-0.5">gün kaldı</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[20px] font-bold text-[#1c1c1c] tabular-nums">{activePeriod._count.applications}</p>
                    <p className="text-[11px] text-[#aeaeb2]">başvuru</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-black/[0.06] rounded-2xl p-5 text-center shadow-[0_1px_6px_rgba(0,0,0,0.04)]">
                <p className="text-[13px] text-[#6e6e73]">Aktif dönem yok.</p>
                <Link
                  href="/admin/periods"
                  className="mt-2 inline-block text-[13px] font-medium text-[#fab758] hover:opacity-70 transition-opacity"
                >
                  Dönem Oluştur →
                </Link>
              </div>
            )}
          </div>

          {/* Durum dağılımı */}
          <div>
            <h2 className="text-[12px] font-semibold text-[#aeaeb2] uppercase tracking-wider mb-2.5">
              Durum Dağılımı
            </h2>
            <div className="bg-white border border-black/[0.06] rounded-2xl overflow-hidden shadow-[0_1px_6px_rgba(0,0,0,0.04)] divide-y divide-black/[0.04]">
              {(["SUBMITTED", "IN_REVIEW", "EVALUATED", "SUPPORTED", "REJECTED"] as ApplicationStatus[]).map((s) => (
                <Link
                  key={s}
                  href={`/admin/applications?status=${s}`}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-[#fafafa] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[s]}`} />
                    <span className={`text-[12px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[s]}`}>
                      {STATUS_LABELS[s]}
                    </span>
                  </div>
                  <span className="text-[13px] font-semibold text-[#1c1c1c] tabular-nums">
                    {countMap[s] ?? 0}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Sağ kolon */}
        <div className="lg:col-span-2 space-y-4">
          {/* Bekleyen işlemler */}
          {(pending > 0 || evaluated > 0) && (
            <div className="space-y-2">
              <h2 className="text-[12px] font-semibold text-[#aeaeb2] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> Bekleyen İşlemler
              </h2>
              {pending > 0 && (
                <Link
                  href="/admin/applications?status=SUBMITTED"
                  className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-2xl px-5 py-3.5 hover:border-blue-300 hover:bg-blue-50/80 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    <p className="text-[13px] font-medium text-blue-800">
                      {pending} başvuru inceleme bekliyor
                    </p>
                  </div>
                  <span className="text-[13px] font-semibold text-blue-600">İncele →</span>
                </Link>
              )}
              {evaluated > 0 && (
                <Link
                  href="/admin/applications?status=EVALUATED"
                  className="flex items-center justify-between bg-purple-50 border border-purple-100 rounded-2xl px-5 py-3.5 hover:border-purple-300 hover:bg-purple-50/80 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                    <p className="text-[13px] font-medium text-purple-800">
                      {evaluated} başvuru destek kararı bekliyor
                    </p>
                  </div>
                  <span className="text-[13px] font-semibold text-purple-600">Karar Ver →</span>
                </Link>
              )}
            </div>
          )}

          {/* Son başvurular */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-[12px] font-semibold text-[#aeaeb2] uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3" /> Son Başvurular
              </h2>
              <Link href="/admin/applications" className="text-[12px] font-medium text-[#fab758] hover:opacity-70 transition-opacity">
                Tümünü gör →
              </Link>
            </div>
            <div className="bg-white border border-black/[0.06] rounded-2xl overflow-hidden shadow-[0_1px_6px_rgba(0,0,0,0.04)] divide-y divide-black/[0.04]">
              {recentApps.length === 0 ? (
                <p className="text-[13px] text-[#6e6e73] p-6 text-center">Henüz başvuru yok.</p>
              ) : (
                recentApps.map((app) => (
                  <Link
                    key={app.id}
                    href={`/admin/applications/${app.id}`}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-[#fafafa] transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-[#1c1c1c] truncate">{app.title}</p>
                      <p className="text-[11px] text-[#aeaeb2] mt-0.5">
                        {app.user.name ?? app.user.email} · {fmt(app.createdAt)}
                      </p>
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ml-3 ${STATUS_COLORS[app.status]}`}>
                      {STATUS_LABELS[app.status]}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

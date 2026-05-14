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
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import { truncate } from "@/lib/utils"

export const metadata = { title: "Yönetim Paneli — Mikro Destek Fonu" }

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  DRAFT: "Taslak", SUBMITTED: "Gönderildi", IN_REVIEW: "Ön İnceleme Sürecinde",
  EVALUATED: "Jüri Değerlendirme Sürecinde", SUPPORTED: "Desteklendi", REJECTED: "Reddedildi",
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

  const [statusCounts, recentApps, totalJury] = await Promise.all([
    prisma.application.groupBy({ by: ["status"], _count: { _all: true } }),
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

  const pending   = countMap.SUBMITTED ?? 0
  const inReview  = countMap.IN_REVIEW ?? 0
  const evaluated = countMap.EVALUATED ?? 0
  const total     = Object.values(countMap).reduce((a, b) => a + b, 0)

  const fmt = (d: Date) =>
    new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })

  return (
    <div className="space-y-8">

      {/* Sayfa başlığı */}
      <div className="pb-6 border-b border-[#e8e8e8]">
        <h1 className="text-[26px] font-bold text-[#1c1c1c] tracking-tight">Genel Bakış</h1>
        <p className="text-[14px] text-[#b0b0b0] mt-1">
          Hoş geldiniz, {session.user.name ?? session.user.email}
        </p>
      </div>

      {/* Stat kartları */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Sol kolon */}
        <div className="space-y-4">

          {/* Durum dağılımı — donut chart */}
          {(() => {
            const CHART_STATUSES: ApplicationStatus[] = ["SUBMITTED", "IN_REVIEW", "EVALUATED", "SUPPORTED", "REJECTED"]
            const CHART_COLORS: Record<ApplicationStatus, string> = {
              DRAFT:     "#94a3b8",
              SUBMITTED: "#3b82f6",
              IN_REVIEW: "#f59e0b",
              EVALUATED: "#a855f7",
              SUPPORTED: "#10b981",
              REJECTED:  "#ef4444",
            }
            const segments = CHART_STATUSES.map((s) => ({
              status: s,
              count: countMap[s] ?? 0,
              color: CHART_COLORS[s],
            }))
            const chartTotal = segments.reduce((a, s) => a + s.count, 0)
            const radius = 72
            const stroke = 16
            const circumference = 2 * Math.PI * radius
            let offset = 0

            return (
              <div className="bg-white border border-black/[0.06] rounded-2xl shadow-[0_1px_6px_rgba(0,0,0,0.04)] p-5">
                <h2 className="text-[12px] font-semibold text-[#aeaeb2] uppercase tracking-wider mb-4">
                  Durum Dağılımı
                </h2>
                <div className="flex items-center gap-6">
                  {/* Donut */}
                  <div className="relative shrink-0 flex-1 flex justify-center">
                    <svg width="180" height="180" viewBox="0 0 180 180">
                      {/* Boş arka plan halkası */}
                      <circle cx="90" cy="90" r={radius} fill="none" stroke="#f0f0f0" strokeWidth={stroke} />
                      {chartTotal > 0 && segments.map((seg) => {
                        if (seg.count === 0) return null
                        const segLen = (seg.count / chartTotal) * circumference
                        const gap = segments.filter(s => s.count > 0).length > 1 ? 3 : 0
                        const el = (
                          <circle
                            key={seg.status}
                            cx="90" cy="90" r={radius}
                            fill="none"
                            stroke={seg.color}
                            strokeWidth={stroke}
                            strokeDasharray={`${Math.max(0, segLen - gap)} ${circumference - Math.max(0, segLen - gap)}`}
                            strokeDashoffset={-offset}
                            strokeLinecap="round"
                            transform="rotate(-90 90 90)"
                            className="transition-all duration-500"
                          />
                        )
                        offset += segLen
                        return el
                      })}
                    </svg>
                    {/* Merkez sayı */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[26px] font-bold text-[#1c1c1c] tabular-nums leading-none">{chartTotal}</span>
                      <span className="text-[10px] text-[#aeaeb2] mt-0.5">toplam</span>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex-1 space-y-2.5">
                    {segments.map((seg) => (
                      <Link
                        key={seg.status}
                        href={`/admin/applications?status=${seg.status}`}
                        className="flex items-center justify-between py-1.5 hover:opacity-70 transition-opacity cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                          <span className="text-[13px] text-[#6e6e73]">{STATUS_LABELS[seg.status]}</span>
                        </div>
                        <span className="text-[14px] font-semibold text-[#1c1c1c] tabular-nums">{seg.count}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )
          })()}
        </div>

        {/* Sağ kolon */}
        <div className="space-y-4">
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
              <Link href="/admin/applications" className="text-[12px] font-medium text-[#fab758] hover:opacity-80 underline-offset-2 hover:underline transition-all">
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
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-[#f4f4f4] transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-[#1c1c1c] truncate" title={app.title}>{truncate(app.title, 30)}</p>
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

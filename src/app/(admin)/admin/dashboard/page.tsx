import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import type { ApplicationStatus } from "@prisma/client"

export const metadata = { title: "Yönetim Paneli — Mikro Destek Fonu" }

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  DRAFT: "Taslak", SUBMITTED: "Gönderildi", IN_REVIEW: "İncelemede",
  EVALUATED: "Değerlendirildi", SUPPORTED: "Desteklendi", REJECTED: "Reddedildi",
}

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  SUBMITTED: "bg-blue-100 text-blue-700",
  IN_REVIEW: "bg-amber-100 text-amber-700",
  EVALUATED: "bg-purple-100 text-purple-700",
  SUPPORTED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
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

  const pending = countMap.SUBMITTED ?? 0
  const inReview = countMap.IN_REVIEW ?? 0
  const evaluated = countMap.EVALUATED ?? 0
  const total = Object.values(countMap).reduce((a, b) => a + b, 0)

  const daysLeft = activePeriod
    ? Math.max(0, Math.ceil((new Date(activePeriod.endDate).getTime() - now.getTime()) / 86_400_000))
    : null

  const fmt = (d: Date) =>
    new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Genel Bakış</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Hoş geldiniz, {session.user.name ?? session.user.email}
        </p>
      </div>

      {/* Stat kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Toplam Başvuru", value: total, sub: "tüm dönemler" },
          { label: "İnceleme Bekleyen", value: pending, sub: "aksiyon gerekiyor", highlight: pending > 0 },
          { label: "İncelemede", value: inReview, sub: "jüri değerlendiriyor" },
          { label: "Jüri Üyesi", value: totalJury, sub: "kayıtlı" },
        ].map((s) => (
          <div
            key={s.label}
            className={`bg-white border rounded-xl p-5 ${s.highlight ? "border-[#fab758]" : ""}`}
          >
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-3xl font-bold mt-1 text-[#212121]">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol kolon */}
        <div className="space-y-5">
          <h2 className="text-sm font-semibold">Aktif Dönem</h2>
          {activePeriod ? (
            <div className="bg-white border border-[#fab758] rounded-xl p-5">
              <p className="font-semibold text-[#212121]">{activePeriod.title}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {fmt(activePeriod.startDate)} — {fmt(activePeriod.endDate)}
              </p>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-[#212121]">{daysLeft}</p>
                  <p className="text-xs text-muted-foreground">gün kaldı</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {activePeriod._count.applications} başvuru
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white border rounded-xl p-5 text-center">
              <p className="text-sm text-muted-foreground">Aktif dönem yok.</p>
              <Link
                href="/admin/periods"
                className="mt-3 inline-block text-sm font-medium text-[#fab758] hover:underline"
              >
                Dönem Oluştur →
              </Link>
            </div>
          )}

          <h2 className="text-sm font-semibold">Durum Dağılımı</h2>
          <div className="bg-white border rounded-xl divide-y">
            {(["SUBMITTED", "IN_REVIEW", "EVALUATED", "SUPPORTED", "REJECTED"] as ApplicationStatus[]).map((s) => (
              <Link
                key={s}
                href={`/admin/applications?status=${s}`}
                className="flex items-center justify-between px-4 py-2.5 hover:bg-[#f6f7f9] transition-colors"
              >
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[s]}`}>
                  {STATUS_LABELS[s]}
                </span>
                <span className="text-sm font-semibold text-[#212121]">{countMap[s] ?? 0}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Sağ kolon */}
        <div className="lg:col-span-2 space-y-5">
          {/* Bekleyen işlemler */}
          {(pending > 0 || evaluated > 0) && (
            <>
              <h2 className="text-sm font-semibold">Bekleyen İşlemler</h2>
              <div className="space-y-2">
                {pending > 0 && (
                  <Link
                    href="/admin/applications?status=SUBMITTED"
                    className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 hover:border-blue-400 transition-colors"
                  >
                    <p className="text-sm font-medium text-blue-800">
                      {pending} başvuru inceleme bekliyor
                    </p>
                    <span className="text-xs font-medium text-blue-600">İncele →</span>
                  </Link>
                )}
                {evaluated > 0 && (
                  <Link
                    href="/admin/applications?status=EVALUATED"
                    className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-xl px-5 py-4 hover:border-purple-400 transition-colors"
                  >
                    <p className="text-sm font-medium text-purple-800">
                      {evaluated} başvuru destek kararı bekliyor
                    </p>
                    <span className="text-xs font-medium text-purple-600">Karar Ver →</span>
                  </Link>
                )}
              </div>
            </>
          )}

          {/* Son başvurular */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Son Başvurular</h2>
            <Link href="/admin/applications" className="text-xs text-[#fab758] hover:underline">
              Tümünü gör →
            </Link>
          </div>
          <div className="bg-white border rounded-xl divide-y">
            {recentApps.length === 0 ? (
              <p className="text-sm text-muted-foreground p-5 text-center">Henüz başvuru yok.</p>
            ) : (
              recentApps.map((app) => (
                <Link
                  key={app.id}
                  href={`/admin/applications/${app.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-[#f6f7f9] transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{app.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {app.user.name ?? app.user.email} · {fmt(app.createdAt)}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ml-3 ${STATUS_COLORS[app.status]}`}>
                    {STATUS_LABELS[app.status]}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

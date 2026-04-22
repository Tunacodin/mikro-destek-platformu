import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { AdminApplicationList } from "@/components/admin/AdminApplicationList"
import { ExcelImportButton } from "@/components/admin/ExcelImportButton"
import type { ApplicationStatus } from "@prisma/client"

export const metadata = { title: "Başvurular — Mikro Destek Fonu" }

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; period?: string }>
}) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") redirect("/login")

  const { status, period } = await searchParams

  const [applications, periods, statusCounts] = await Promise.all([
    prisma.application.findMany({
      where: {
        ...(status ? { status: status as ApplicationStatus } : {}),
        ...(period ? { periodId: period } : {}),
      },
      include: {
        user:    { select: { name: true, email: true } },
        period:  { select: { title: true } },
        program: { select: { title: true } },
        _count:  { select: { files: true, juryAssignments: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.applicationPeriod.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true },
    }),
    prisma.application.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ])

  const countMap = Object.fromEntries(
    statusCounts.map((s) => [s.status, s._count._all])
  ) as Partial<Record<ApplicationStatus, number>>

  const total = Object.values(countMap).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-6">
      <div className="pb-6 border-b border-[#e8e8e8] flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#1c1c1c] tracking-tight">Başvurular</h1>
          <p className="text-[14px] text-[#b0b0b0] mt-1">Mikro Destek Platformu başvuruları ve değerlendirme yönetimi</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <p className="text-[14px] text-[#6e6e73] tabular-nums">
            Toplam <span className="font-semibold text-[#1c1c1c]">{total}</span> başvuru
            {(status || period) && <span className="text-[#b0b0b0]"> · {applications.length} sonuç</span>}
          </p>
          <ExcelImportButton periods={periods} />
        </div>
      </div>

      <AdminApplicationList
        applications={applications}
        periods={periods}
        countMap={countMap}
        total={total}
        currentStatus={status}
        currentPeriod={period}
      />
    </div>
  )
}

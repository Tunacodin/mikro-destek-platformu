import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { AdminApplicationList } from "@/components/admin/AdminApplicationList"
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

  const applications = await prisma.application.findMany({
    where: {
      ...(status ? { status: status as ApplicationStatus } : {}),
      ...(period ? { periodId: period } : {}),
    },
    include: {
      user: { select: { name: true, email: true } },
      period: { select: { title: true } },
      _count: { select: { files: true, juryAssignments: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const periods = await prisma.applicationPeriod.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true },
  })

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="pb-5 border-b border-black/[0.06]">
        <h1 className="text-[22px] sm:text-[26px] font-semibold tracking-tight text-[#1c1c1c] leading-none">
          Başvurular
        </h1>
        <p className="text-[13px] text-[#6e6e73] mt-2">
          {applications.length} başvuru
        </p>
      </div>

      <AdminApplicationList
        applications={applications}
        periods={periods}
        currentStatus={status}
        currentPeriod={period}
      />
    </div>
  )
}

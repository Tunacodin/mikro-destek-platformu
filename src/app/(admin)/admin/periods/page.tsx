import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PeriodList } from "@/components/admin/PeriodList"
import { CreatePeriodForm } from "@/components/admin/CreatePeriodForm"

export const metadata = { title: "Başvuru Dönemleri — Mikro Destek Fonu" }

export default async function AdminPeriodsPage() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") redirect("/login")

  const periods = await prisma.applicationPeriod.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { applications: true } } },
  })

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="pb-5 border-b border-black/[0.06]">
        <h1 className="text-[22px] sm:text-[26px] font-semibold tracking-tight text-[#1c1c1c] leading-none">
          Başvuru Dönemleri
        </h1>
        <p className="text-[13px] text-[#6e6e73] mt-2">
          Dönem oluşturun, yayınlayın ve kapatın.
        </p>
      </div>

      {/* Yeni Dönem Oluştur */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] p-5 sm:p-6">
        <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-[0.12em] mb-4">
          Yeni Dönem Oluştur
        </p>
        <CreatePeriodForm />
      </div>

      {/* Mevcut Dönemler */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] p-5 sm:p-6">
        <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-[0.12em] mb-4">
          Dönemler
          {periods.length > 0 && (
            <span className="ml-2 font-normal text-[#aeaeb2]">{periods.length}</span>
          )}
        </p>
        <PeriodList periods={periods} />
      </div>
    </div>
  )
}

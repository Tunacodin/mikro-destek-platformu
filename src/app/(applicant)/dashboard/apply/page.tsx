import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ApplicationForm } from "@/components/application/ApplicationForm"

export const metadata = { title: "Yeni Başvuru — Mikro Destek Fonu" }

export default async function ApplyPage() {
  const session = await auth()
  if (!session || session.user.role !== "APPLICANT") redirect("/login")

  const activePeriods = await prisma.applicationPeriod.findMany({
    where: { status: "ACTIVE" },
    orderBy: { endDate: "asc" },
  })

  if (activePeriods.length === 0) {
    return (
      <div className="space-y-7">
        <div className="pb-6 border-b border-black/[0.06]">
          <p className="text-[11px] font-semibold text-[#aeaeb2] uppercase tracking-widest mb-2">
            Komünite Üyesi
          </p>
          <h1 className="text-[26px] font-semibold tracking-tight text-[#1c1c1c] leading-none">
            Yeni Başvuru
          </h1>
        </div>
        <div className="max-w-xl bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] p-12 text-center">
          <p className="text-[15px] font-semibold text-[#1c1c1c]">Aktif başvuru dönemi yok</p>
          <p className="text-[13px] text-[#6e6e73] mt-1.5">
            Yeni bir dönem açıldığında burada görünecek.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-7">
      {/* Başlık */}
      <div className="pb-6 border-b border-black/[0.06]">
        <p className="text-[11px] font-semibold text-[#aeaeb2] uppercase tracking-widest mb-2">
          Komünite Üyesi
        </p>
        <h1 className="text-[22px] sm:text-[26px] font-semibold tracking-tight text-[#1c1c1c] leading-none">
          Yeni Başvuru
        </h1>
        <p className="text-[13px] text-[#6e6e73] mt-2">
          Bilgilerinizi doldurun, belgelerinizi yükleyin ve gönderin.
        </p>
      </div>

      <ApplicationForm periods={activePeriods} userId={session.user.id} />
    </div>
  )
}

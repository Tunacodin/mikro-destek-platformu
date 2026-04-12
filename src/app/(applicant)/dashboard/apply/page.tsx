import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ApplicationForm } from "@/components/application/ApplicationForm"

export const metadata = { title: "Yeni Başvuru — Mikro Destek Fonu" }

export default async function ApplyPage() {
  const session = await auth()
  if (!session || session.user.role !== "APPLICANT") redirect("/login")

  const [activePeriods, activePrograms, user] = await Promise.all([
    prisma.applicationPeriod.findMany({
      where: { status: "ACTIVE" },
      orderBy: { endDate: "asc" },
    }),
    prisma.program.findMany({
      where: { status: "ACTIVE" },
      orderBy: { endDate: "asc" },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true, email: true,
        phone: true, educationStatus: true, department: true,
        address: true, communityProfileUrl: true,
        linkedinUrl: true, twitterUrl: true,
      },
    }),
  ])

  if (activePeriods.length === 0 && activePrograms.length === 0) {
    return (
      <div className="space-y-8">
        <div className="pb-6 border-b border-[#e8e8e8]">
          <h1 className="text-[26px] font-bold text-[#1c1c1c] tracking-tight">Yeni Başvuru</h1>
          <p className="text-[14px] text-[#b0b0b0] mt-1">Başvuru oluşturun</p>
        </div>
        <div className="max-w-xl bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] p-12 text-center">
          <p className="text-[15px] font-semibold text-[#1c1c1c]">Aktif dönem veya program yok</p>
          <p className="text-[13px] text-[#6e6e73] mt-1.5">
            Yeni bir dönem ya da program açıldığında burada görünecek.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="pb-6 border-b border-[#e8e8e8]">
        <h1 className="text-[26px] font-bold text-[#1c1c1c] tracking-tight">Yeni Başvuru</h1>
        <p className="text-[14px] text-[#b0b0b0] mt-1">
          Bilgilerinizi doldurun, belgelerinizi yükleyin ve gönderin.
        </p>
      </div>

      <ApplicationForm
        periods={activePeriods}
        programs={activePrograms}
        userProfile={user}
      />
    </div>
  )
}

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { JuryInviteForm } from "@/components/admin/JuryInviteForm"
import { JuryList } from "@/components/admin/JuryList"

export const metadata = { title: "Jüri Yönetimi — Mikro Destek Fonu" }

export default async function AdminJuryPage() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") redirect("/login")

  const juryMembers = await prisma.user.findMany({
    where: { role: "JURY" },
    select: {
      id: true,
      email: true,
      name: true,
      juryTitle: true,
      juryOrganization: true,
      juryExpertise: true,
      juryBio: true,
      juryActive: true,
      onboardingCompleted: true,
      createdAt: true,
      _count: { select: { juryAssignments: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-8">
      {/* Başlık */}
      <div className="pb-6 border-b border-[#e8e8e8] flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#1c1c1c] tracking-tight">Jüri Yönetimi</h1>
          <p className="text-[14px] text-[#b0b0b0] mt-1">Disiplinel kurul üyelerini yönetin ve davet edin</p>
        </div>
        <p className="text-[14px] text-[#6e6e73] shrink-0 tabular-nums">
          Toplam <span className="font-semibold text-[#1c1c1c]">{juryMembers.length}</span> jüri üyesi
        </p>
      </div>

      {/* %50 — %50 grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* Sol: Yeni Jüri Davet */}
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] p-5 sm:p-6">
          <p className="text-[13px] font-semibold text-[#1c1c1c] mb-4">Yeni Jüri Üyesi Davet Et</p>
          <JuryInviteForm />
        </div>

        {/* Sağ: Jüri Listesi */}
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] p-5 sm:p-6">
          <p className="text-[13px] font-semibold text-[#1c1c1c] mb-4">
            Jüri Üyeleri
            {juryMembers.length > 0 && (
              <span className="ml-2 font-normal text-[#aeaeb2]">{juryMembers.length}</span>
            )}
          </p>
          <JuryList members={juryMembers} />
        </div>

      </div>
    </div>
  )
}

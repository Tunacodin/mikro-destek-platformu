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
      onboardingCompleted: true,
      createdAt: true,
      _count: { select: { juryAssignments: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="pb-5 border-b border-black/[0.06]">
        <h1 className="text-[22px] sm:text-[26px] font-semibold tracking-tight text-[#1c1c1c] leading-none">
          Jüri Yönetimi
        </h1>
        <p className="text-[13px] text-[#6e6e73] mt-2">
          Jüri üyelerini e-posta ile davet edin. Üyeler ayrı hesap oluşturmadan sisteme giriş yapar.
        </p>
      </div>

      {/* Davet Formu */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] p-5 sm:p-6">
        <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-[0.12em] mb-4">
          Yeni Jüri Üyesi Davet Et
        </p>
        <JuryInviteForm />
      </div>

      {/* Jüri Listesi */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] p-5 sm:p-6">
        <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-[0.12em] mb-4">
          Jüri Üyeleri
          {juryMembers.length > 0 && (
            <span className="ml-2 font-normal">{juryMembers.length}</span>
          )}
        </p>
        <JuryList members={juryMembers} />
      </div>
    </div>
  )
}

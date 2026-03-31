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
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Jüri Yönetimi</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Jüri üyelerini e-posta ile davet edin. Üyeler ayrı hesap oluşturmadan sisteme giriş yapar.
        </p>
      </div>

      {/* Davet Formu */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="font-semibold mb-4">Yeni Jüri Üyesi Davet Et</h2>
        <JuryInviteForm />
      </div>

      {/* Mevcut Jüri Listesi */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="font-semibold mb-4">
          Jüri Üyeleri{" "}
          <span className="text-muted-foreground font-normal text-sm">({juryMembers.length})</span>
        </h2>
        <JuryList members={juryMembers} />
      </div>
    </div>
  )
}

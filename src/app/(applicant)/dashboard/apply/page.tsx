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
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">Yeni Başvuru</h1>
        <div className="bg-white border rounded-lg p-8 text-center">
          <p className="font-medium">Şu an aktif başvuru dönemi yok.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Yeni bir dönem açıldığında burada görünecek.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">Yeni Başvuru</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Bilgilerinizi doldurun, belgelerinizi yükleyin ve gönderin.
      </p>
      <ApplicationForm periods={activePeriods} userId={session.user.id} />
    </div>
  )
}

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
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Başvuru Dönemleri</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Dönem oluşturun, yayınlayın ve kapatın.
        </p>
      </div>

      <div className="bg-white border rounded-lg p-6">
        <h2 className="font-semibold mb-4">Yeni Dönem Oluştur</h2>
        <CreatePeriodForm />
      </div>

      <div className="bg-white border rounded-lg p-6">
        <h2 className="font-semibold mb-4">
          Dönemler{" "}
          <span className="text-muted-foreground font-normal text-sm">({periods.length})</span>
        </h2>
        <PeriodList periods={periods} />
      </div>
    </div>
  )
}

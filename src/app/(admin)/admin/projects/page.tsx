import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { AdminProjectList } from "@/components/admin/AdminProjectList"

export const metadata = { title: "Projeler — Mikro Destek Fonu" }

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>
}) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") redirect("/login")

  const { scope } = await searchParams

  const projects = await prisma.project.findMany({
    where: scope ? { decision: { scope } } : {},
    orderBy: { createdAt: "desc" },
    include: {
      application: {
        include: {
          user:    { select: { name: true, email: true } },
          period:  { select: { title: true } },
          program: { select: { title: true } },
        },
      },
      decision: { select: { scope: true, decidedAt: true } },
      reports:  { select: { id: true } },
      files:    { select: { id: true } },
    },
  })

  const scopeCounts = {
    LIMITED:  await prisma.project.count({ where: { decision: { scope: "LIMITED" } } }),
    EXTENDED: await prisma.project.count({ where: { decision: { scope: "EXTENDED" } } }),
    PRIORITY: await prisma.project.count({ where: { decision: { scope: "PRIORITY" } } }),
  }
  const total = scopeCounts.LIMITED + scopeCounts.EXTENDED + scopeCounts.PRIORITY
  const active = projects.filter((p) => p.status === "ACTIVE").length

  return (
    <div className="space-y-6">
      <div className="pb-6 border-b border-[#e8e8e8] flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#1c1c1c] tracking-tight">Projeler</h1>
          <p className="text-[14px] text-[#b0b0b0] mt-1">Desteklenen projelerin takibi ve yönetimi</p>
        </div>
        <div className="flex items-center gap-4 shrink-0 text-[14px] text-[#6e6e73] tabular-nums">
          <span>Toplam <span className="font-semibold text-[#1c1c1c]">{total}</span> proje</span>
          <span className="text-[#d1d1d6]">·</span>
          <span><span className="font-semibold text-emerald-600">{active}</span> aktif</span>
        </div>
      </div>

      <AdminProjectList
        projects={projects}
        scopeCounts={scopeCounts}
        total={total}
        currentScope={scope}
      />
    </div>
  )
}

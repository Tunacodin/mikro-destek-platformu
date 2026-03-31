import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import type { ApplicationStatus } from "@prisma/client"

export const metadata = { title: "Atamalarım — Mikro Destek Fonu" }

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  DRAFT: "Taslak", SUBMITTED: "Gönderildi", IN_REVIEW: "İncelemede",
  EVALUATED: "Değerlendirildi", SUPPORTED: "Desteklendi", REJECTED: "Reddedildi",
}
const STATUS_COLORS: Record<ApplicationStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700", SUBMITTED: "bg-blue-100 text-blue-700",
  IN_REVIEW: "bg-amber-100 text-amber-700", EVALUATED: "bg-purple-100 text-purple-700",
  SUPPORTED: "bg-green-100 text-green-700", REJECTED: "bg-red-100 text-red-700",
}

export default async function JuryAssignmentsPage() {
  const session = await auth()
  if (!session || session.user.role !== "JURY") redirect("/login")

  const assignments = await prisma.juryAssignment.findMany({
    where: { juryId: session.user.id },
    include: {
      application: {
        include: {
          user: { select: { name: true, email: true } },
          period: { select: { title: true } },
          evaluation: { select: { id: true } },
          _count: { select: { files: true } },
        },
      },
    },
    orderBy: { assignedAt: "desc" },
  })

  const pending = assignments.filter((a) => a.application.status === "IN_REVIEW")
  const done = assignments.filter((a) => a.application.status !== "IN_REVIEW")

  return (
    <div className="p-6 overflow-auto h-full">
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Atamalarım</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {pending.length} bekleyen · {done.length} tamamlanan
        </p>
      </div>

      {assignments.length === 0 && (
        <div className="bg-white border rounded-lg p-8 text-center">
          <p className="text-sm text-muted-foreground">Henüz atama yapılmadı.</p>
        </div>
      )}

      {pending.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Değerlendirme Bekliyor
          </h2>
          <AssignmentList items={pending} />
        </section>
      )}

      {done.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Tamamlanan
          </h2>
          <AssignmentList items={done} />
        </section>
      )}
    </div>
    </div>
  )
}

function AssignmentList({
  items,
}: {
  items: Awaited<ReturnType<typeof prisma.juryAssignment.findMany<{
    include: {
      application: {
        include: {
          user: { select: { name: true; email: true } }
          period: { select: { title: true } }
          evaluation: { select: { id: true } }
          _count: { select: { files: true } }
        }
      }
    }
  }>>>
}) {
  return (
    <div className="bg-white border rounded-lg divide-y">
      {items.map(({ application: app }) => {
        const canEval = app.status === "IN_REVIEW"
        return (
          <div key={app.id} className="p-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{app.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {app.user.name ?? app.user.email} · {app.period.title} ·{" "}
                {app._count.files} dosya
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[app.status]}`}>
                {STATUS_LABELS[app.status]}
              </span>
              {app.evaluation && (
                <span className="text-xs text-purple-600 font-medium">✓ Değerlendirildi</span>
              )}
              {canEval && (
                <Link
                  href={`/jury/evaluate/${app.id}`}
                  className="text-xs px-3 py-1 bg-slate-900 text-white rounded-md hover:bg-slate-700 transition-colors"
                >
                  Değerlendir
                </Link>
              )}
              {!canEval && (
                <Link
                  href={`/jury/evaluate/${app.id}`}
                  className="text-xs px-3 py-1 border rounded-md hover:bg-slate-50 transition-colors"
                >
                  Görüntüle
                </Link>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

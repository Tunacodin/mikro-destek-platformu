import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import type { ApplicationStatus } from "@prisma/client"
import { truncate } from "@/lib/utils"

export const metadata = { title: "Atamalarım — Mikro Destek Fonu" }

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  DRAFT: "Taslak", SUBMITTED: "Gönderildi", IN_REVIEW: "Ön İnceleme Sürecinde",
  EVALUATED: "Jüri Değerlendirme Sürecinde", SUPPORTED: "Desteklendi", REJECTED: "Reddedildi",
}
const STATUS_STYLES: Record<ApplicationStatus, string> = {
  DRAFT:     "bg-[#f0f0f0] text-[#6e6e73]",
  SUBMITTED: "bg-blue-50 text-blue-600",
  IN_REVIEW: "bg-amber-50 text-amber-600",
  EVALUATED: "bg-purple-50 text-purple-600",
  SUPPORTED: "bg-emerald-50 text-emerald-600",
  REJECTED:  "bg-red-50 text-red-500",
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
          period:  { select: { title: true } },
          program: { select: { title: true } },
          evaluations: { where: { juryId: session.user.id }, select: { id: true } },
          _count: { select: { files: true } },
        },
      },
    },
    orderBy: { assignedAt: "desc" },
  })

  const pending = assignments.filter((a) => a.application.status === "IN_REVIEW")
  const done    = assignments.filter((a) => a.application.status !== "IN_REVIEW")

  return (
    <div className="p-4 sm:p-8">
      <div className="space-y-6">

        {/* Başlık */}
        <div className="pb-5 border-b border-black/[0.06]">
          <p className="text-[11px] font-semibold text-[#aeaeb2] uppercase tracking-widest mb-2">
            Jüri Üyesi
          </p>
          <h1 className="text-[22px] sm:text-[26px] font-semibold tracking-tight text-[#1c1c1c] leading-none">
            Atamalarım
          </h1>
          <p className="text-[13px] text-[#6e6e73] mt-2">
            {pending.length} bekleyen · {done.length} tamamlanan
          </p>
        </div>

        {/* Boş */}
        {assignments.length === 0 && (
          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] p-12 text-center">
            <p className="text-[15px] font-semibold text-[#1c1c1c]">Henüz atama yapılmadı</p>
            <p className="text-[13px] text-[#6e6e73] mt-1.5">
              Program yöneticisi başvuruları atadığında burada görünecek.
            </p>
          </div>
        )}

        {/* Bekleyen */}
        {pending.length > 0 && (
          <section className="space-y-3">
            <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-[0.12em]">
              Değerlendirme Bekliyor
            </p>
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] overflow-hidden divide-y divide-black/[0.04]">
              {pending.map(({ application: app }) => (
                <AssignmentRow key={app.id} app={app} canEval />
              ))}
            </div>
          </section>
        )}

        {/* Tamamlanan */}
        {done.length > 0 && (
          <section className="space-y-3">
            <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-[0.12em]">
              Tamamlanan
            </p>
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] overflow-hidden divide-y divide-black/[0.04]">
              {done.map(({ application: app }) => (
                <AssignmentRow key={app.id} app={app} canEval={false} />
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  )
}

function AssignmentRow({
  app, canEval,
}: {
  app: {
    id: string; title: string; status: ApplicationStatus;
    user: { name: string | null; email: string };
    period:  { title: string } | null;
    program: { title: string } | null;
    evaluations: { id: string }[];
    _count: { files: number };
  }
  canEval: boolean
}) {
  return (
    <div className="px-4 sm:px-5 py-4 hover:bg-[#f4f4f4] transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1 flex-1">
          <p className="text-[14px] font-semibold text-[#1c1c1c] truncate" title={app.title}>{truncate(app.title, 30)}</p>
          <p className="text-[12px] text-[#6e6e73] truncate">
            {app.user.name ?? app.user.email} · {app.period?.title ?? app.program?.title ?? "—"} · {app._count.files} dosya
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`hidden sm:inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[app.status]}`}>
            {STATUS_LABELS[app.status]}
          </span>
          {app.evaluations.length > 0 && (
            <span className="hidden sm:inline text-[11px] font-medium text-emerald-600">✓</span>
          )}
          <Link
            href={`/jury/evaluate/${app.id}`}
            className={canEval
              ? "text-[12px] font-semibold px-3 py-1.5 bg-[#212121] text-white rounded-xl hover:bg-[#383838] transition-colors cursor-pointer"
              : "text-[12px] font-medium px-3 py-1.5 bg-[#f0f0f0] text-[#6e6e73] rounded-xl hover:bg-[#e8e8e8] transition-colors"
            }
          >
            Görüntüle
          </Link>
        </div>
      </div>
      {/* Mobilde durum badge'i alt satırda */}
      <div className="flex items-center gap-2 mt-2 sm:hidden">
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[app.status]}`}>
          {STATUS_LABELS[app.status]}
        </span>
        {app.evaluations.length > 0 && (
          <span className="text-[11px] font-medium text-emerald-600">✓ Tamamlandı</span>
        )}
      </div>
    </div>
  )
}

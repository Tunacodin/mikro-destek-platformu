import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export const metadata = { title: "Jüri Paneli — Mikro Destek Fonu" }

export default async function JuryDashboardPage() {
  const session = await auth()
  if (!session || session.user.role !== "JURY") redirect("/login")

  const juryId = session.user.id

  const assignments = await prisma.juryAssignment.findMany({
    where: { juryId },
    include: {
      application: {
        select: {
          id: true, title: true, status: true,
          evaluation: { select: { id: true } },
          period: { select: { title: true } },
          user: { select: { name: true, email: true } },
        },
      },
    },
    orderBy: { assignedAt: "desc" },
  })

  const pending    = assignments.filter((a) => a.application.status === "IN_REVIEW" && !a.application.evaluation)
  const inProgress = assignments.filter((a) => a.application.status === "IN_REVIEW" && !!a.application.evaluation)
  const completed  = assignments.filter((a) => a.application.status !== "IN_REVIEW")

  const firstName = session.user.name?.split(" ")[0] ?? null

  return (
    <div className="space-y-7">

      {/* Karşılama */}
      <div className="flex items-start justify-between gap-4 pb-6 border-b border-black/[0.06]">
        <div>
          <p className="text-[11px] font-semibold text-[#aeaeb2] uppercase tracking-widest mb-2">
            Jüri Üyesi
          </p>
          <h1 className="text-[26px] font-semibold tracking-tight text-[#1c1c1c] leading-none">
            {firstName ? `Merhaba, ${firstName}` : "Merhaba"}
          </h1>
          <p className="text-[13px] text-[#6e6e73] mt-2">Jüri paneli · {assignments.length} atama</p>
        </div>
        <Link href="/jury/assignments"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-black/[0.07] text-[#1c1c1c] text-[13px] font-medium rounded-xl hover:bg-[#fafafa] transition-colors shrink-0">
          Tüm Atamalarım <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* İstatistik */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Bekleyen"   count={pending.length}    accent="text-amber-500"   bg="bg-amber-50"   border="border-amber-100" />
        <StatCard label="Devam Eden" count={inProgress.length} accent="text-blue-500"    bg="bg-blue-50"    border="border-blue-100" />
        <StatCard label="Tamamlanan" count={completed.length}  accent="text-emerald-500" bg="bg-emerald-50" border="border-emerald-100" />
      </div>

      {/* Bekleyen listesi */}
      {pending.length > 0 && (
        <section className="space-y-3">
          <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-[0.12em]">Değerlendirme Bekliyor</p>
          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] overflow-hidden divide-y divide-black/[0.04]">
            {pending.map(({ application: app }) => (
              <div key={app.id} className="px-6 py-5 flex items-center justify-between gap-4 hover:bg-[#fafafa] transition-colors">
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-[#1c1c1c] truncate">{app.title}</p>
                  <p className="text-[12px] text-[#6e6e73] mt-1">{app.user.name ?? app.user.email} · {app.period.title}</p>
                </div>
                <Link href={`/jury/evaluate/${app.id}`}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#212121] text-white text-[12px] font-semibold rounded-xl hover:opacity-80 transition-opacity whitespace-nowrap">
                  Değerlendir <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Devam Eden listesi */}
      {inProgress.length > 0 && (
        <section className="space-y-3">
          <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-[0.12em]">Devam Eden</p>
          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] overflow-hidden divide-y divide-black/[0.04]">
            {inProgress.map(({ application: app }) => (
              <div key={app.id} className="px-6 py-5 flex items-center justify-between gap-4 hover:bg-[#fafafa] transition-colors">
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-[#1c1c1c] truncate">{app.title}</p>
                  <p className="text-[12px] text-[#6e6e73] mt-1">{app.user.name ?? app.user.email} · {app.period.title}</p>
                </div>
                <Link href={`/jury/evaluate/${app.id}`}
                  className="shrink-0 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#6e6e73] hover:text-[#1c1c1c] transition-colors whitespace-nowrap">
                  Düzenle <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Boş durum */}
      {assignments.length === 0 && (
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] p-12 text-center">
          <p className="text-[15px] font-semibold text-[#1c1c1c]">Henüz atama yapılmadı</p>
          <p className="text-[13px] text-[#6e6e73] mt-1.5">Program yöneticisi başvuruları atadığında burada görünecek.</p>
        </div>
      )}

      {/* Rehber */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] p-6 space-y-3">
        <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-[0.12em]">Değerlendirme Rehberi</p>
        <p className="text-[13px] text-[#6e6e73] leading-relaxed">
          Her başvuru 5 kriter üzerinden değerlendirilir:{" "}
          <span className="text-[#1c1c1c] font-medium">
            Yenilikçilik, Etki Potansiyeli, Uygulanabilirlik, Ekip Yetkinliği, Sürdürülebilirlik.
          </span>{" "}
          Her kriter 1–5 arası puanlanır ve gerekçe yazmak zorunludur.
        </p>
      </div>

    </div>
  )
}

function StatCard({ label, count, accent, bg, border }: { label: string; count: number; accent: string; bg: string; border: string; icon?: ReactNode }) {
  return (
    <div className={`${bg} rounded-2xl border ${border} p-5`}>
      <p className={`text-[32px] font-bold leading-none tabular-nums tracking-tight ${accent}`}>{count}</p>
      <p className="text-[12px] text-[#6e6e73] mt-2.5 font-medium">{label}</p>
    </div>
  )
}

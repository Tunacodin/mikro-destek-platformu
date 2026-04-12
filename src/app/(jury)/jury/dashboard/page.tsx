import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import {
  ArrowRight, ClipboardList, Clock, CheckCircle2, Eye,
  FileText, Calendar, User, Layers,
} from "lucide-react"
import { JuryGuidePanel } from "@/components/jury/JuryGuidePanel"
import { LiveCountdown } from "@/components/ui/LiveCountdown"

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
          id: true, title: true, status: true, createdAt: true,
          presentationDate: true,
          categories: true,
          evaluations: { where: { juryId }, select: { id: true } },
          period:  { select: { title: true } },
          program: { select: { title: true } },
          user: { select: { name: true, email: true } },
          _count: { select: { files: true } },
        },
      },
    },
    orderBy: { assignedAt: "desc" },
  })

  const pending    = assignments.filter((a) => a.application.status === "IN_REVIEW" && a.application.evaluations.length === 0)
  const inProgress = assignments.filter((a) => a.application.status === "IN_REVIEW" && a.application.evaluations.length > 0)
  const completed  = assignments.filter((a) => a.application.status !== "IN_REVIEW")

  const firstName = session.user.name?.split(" ")[0] ?? null
  const totalAssignments = assignments.length

  function fmtShort(d: Date) {
    return new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })
  }

  return (
    <div className="space-y-8">

      {/* Başlık */}
      <div className="pb-6 border-b border-[#e8e8e8] flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#1c1c1c] tracking-tight">
            {firstName ? `Merhaba, ${firstName}` : "Jüri Paneli"}
          </h1>
          <p className="text-[14px] text-[#b0b0b0] mt-1">Değerlendirme süreçlerinizi buradan takip edin</p>
        </div>
        <Link
          href="/jury/assignments"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-black/[0.07] text-[#1c1c1c] text-[13px] font-medium rounded-xl hover:bg-[#f5f5f5] transition-colors shrink-0 self-start sm:self-auto cursor-pointer"
        >
          Tüm Atamalarım <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Stat kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
          <div className="flex items-start justify-between">
            <p className="text-[13px] font-medium text-[#6e6e73]">Toplam Atama</p>
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-blue-500" />
            </div>
          </div>
          <p className="text-[32px] font-bold text-[#1c1c1c] leading-none mt-3 tabular-nums">{totalAssignments}</p>
          <p className="text-[12px] text-[#aeaeb2] mt-1">tüm dönemler</p>
        </div>

        <div className={`bg-white rounded-2xl border shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 ${pending.length > 0 ? "border-amber-200" : "border-black/[0.06]"}`}>
          <div className="flex items-start justify-between">
            <p className="text-[13px] font-medium text-[#6e6e73]">Bekleyen</p>
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <p className="text-[32px] font-bold text-[#1c1c1c] leading-none mt-3 tabular-nums">{pending.length}</p>
          <p className="text-[12px] text-[#aeaeb2] mt-1">değerlendirme bekliyor</p>
        </div>

        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
          <div className="flex items-start justify-between">
            <p className="text-[13px] font-medium text-[#6e6e73]">Devam Eden</p>
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
              <Eye className="w-4 h-4 text-purple-500" />
            </div>
          </div>
          <p className="text-[32px] font-bold text-[#1c1c1c] leading-none mt-3 tabular-nums">{inProgress.length}</p>
          <p className="text-[12px] text-[#aeaeb2] mt-1">taslak değerlendirme</p>
        </div>

        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
          <div className="flex items-start justify-between">
            <p className="text-[13px] font-medium text-[#6e6e73]">Tamamlanan</p>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <p className="text-[32px] font-bold text-[#1c1c1c] leading-none mt-3 tabular-nums">{completed.length}</p>
          <p className="text-[12px] text-[#aeaeb2] mt-1">değerlendirme</p>
        </div>
      </div>

      {/* Alt grid: %50-%50 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Sol: Rehber */}
        <JuryGuidePanel />

        {/* Sağ: Bekleyen + Devam Eden */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-[15px] font-semibold text-[#1c1c1c]">Değerlendirme Bekleyen</h2>
            {pending.length > 0 && (
              <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                {pending.length} yeni
              </span>
            )}
          </div>

          {pending.length === 0 && inProgress.length === 0 && assignments.length > 0 && (
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-10 text-center">
              <div className="w-10 h-10 rounded-2xl bg-[#f5f5f5] flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-[14px] font-medium text-[#1c1c1c]">Tüm değerlendirmeler tamamlandı</p>
              <p className="text-[12px] text-[#aeaeb2] mt-1">Yeni atama geldiğinde burada görünecek</p>
            </div>
          )}

          {assignments.length === 0 && (
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#f5f5f5] flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="w-6 h-6 text-[#aeaeb2]" />
              </div>
              <p className="text-[15px] font-semibold text-[#1c1c1c]">Henüz atama yapılmadı</p>
              <p className="text-[13px] text-[#6e6e73] mt-1.5">
                Program yöneticisi başvuruları atadığında burada görünecek.
              </p>
            </div>
          )}

          {(pending.length > 0 || inProgress.length > 0) && (
            <div className="space-y-3">
              {pending.map(({ application: app, assignedAt }) => (
                  <Link
                    key={app.id}
                    href={`/jury/evaluate/${app.id}`}
                    className="group block bg-white rounded-2xl border border-amber-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:border-amber-200 transition-all cursor-pointer overflow-hidden"
                  >
                    <div className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[14px] font-semibold text-[#1c1c1c] leading-snug line-clamp-2 group-hover:text-[#000]">
                            {app.title}
                          </p>
                          <div className="flex items-center gap-2.5 mt-1.5 flex-wrap text-[11px] text-[#6e6e73]">
                            <span className="inline-flex items-center gap-1">
                              <User className="w-3 h-3 text-[#aeaeb2]" />
                              {app.user.name ?? app.user.email}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Layers className="w-3 h-3 text-[#aeaeb2]" />
                              {app.period?.title ?? app.program?.title ?? "—"}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <FileText className="w-3 h-3 text-[#aeaeb2]" />
                              {app._count.files} belge
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-[#aeaeb2]" />
                              Atandı: {fmtShort(assignedAt)}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#d1d1d6] group-hover:text-amber-500 shrink-0 mt-1 transition-colors" />
                      </div>
                      {app.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {app.categories.map((c: string) => (
                            <span key={c} className="text-[10px] font-medium bg-[#f0f0f0] text-[#6e6e73] px-2 py-0.5 rounded-full">{c}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Canlı geri sayım */}
                    {app.presentationDate && (
                      <div className="px-5 pb-4">
                        <LiveCountdown targetDate={app.presentationDate.toISOString()} label="Jüri Sunumuna" />
                      </div>
                    )}

                    <div className="flex items-center justify-between px-5 py-3 border-t border-black/[0.04] bg-[#fafafa]">
                      <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                        <Clock className="w-3 h-3 inline mr-1" />Değerlendirme Bekliyor
                      </span>
                    </div>
                  </Link>
              ))}

              {inProgress.map(({ application: app, assignedAt }) => (
                  <Link
                    key={app.id}
                    href={`/jury/evaluate/${app.id}`}
                    className="group block bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all cursor-pointer overflow-hidden"
                  >
                    <div className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[14px] font-semibold text-[#1c1c1c] leading-snug line-clamp-2">
                            {app.title}
                          </p>
                          <div className="flex items-center gap-2.5 mt-1.5 flex-wrap text-[11px] text-[#6e6e73]">
                            <span className="inline-flex items-center gap-1">
                              <User className="w-3 h-3 text-[#aeaeb2]" />
                              {app.user.name ?? app.user.email}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Layers className="w-3 h-3 text-[#aeaeb2]" />
                              {app.period?.title ?? app.program?.title ?? "—"}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-[#aeaeb2]" />
                              Atandı: {fmtShort(assignedAt)}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#d1d1d6] group-hover:text-[#6e6e73] shrink-0 mt-1 transition-colors" />
                      </div>
                    </div>

                    {app.presentationDate && (
                      <div className="px-5 pb-4">
                        <LiveCountdown targetDate={app.presentationDate.toISOString()} label="Jüri Sunumuna" />
                      </div>
                    )}

                    <div className="flex items-center justify-between px-5 py-3 border-t border-black/[0.04] bg-[#fafafa]">
                      <span className="text-[11px] font-semibold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">
                        <Eye className="w-3 h-3 inline mr-1" />Devam Ediyor
                      </span>
                    </div>
                  </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

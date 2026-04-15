import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { FolderOpen, ArrowRight, FileText } from "lucide-react"

export const metadata = { title: "Desteklerim — Mikro Destek Fonu" }

const SCOPE_LABELS: Record<string, string> = {
  LIMITED:  "Sınırlı Destek",
  EXTENDED: "Genişletilmiş Destek",
  PRIORITY: "Öncelikli Destek",
}

const SCOPE_STYLES: Record<string, string> = {
  LIMITED:  "bg-amber-50 text-amber-700",
  EXTENDED: "bg-blue-50 text-blue-700",
  PRIORITY: "bg-emerald-50 text-emerald-700",
}

const SCOPE_LEFT: Record<string, string> = {
  LIMITED:  "border-l-[#fab758]",
  EXTENDED: "border-l-blue-400",
  PRIORITY: "border-l-emerald-500",
}

export default async function ProjectsListPage() {
  const session = await auth()
  if (!session || session.user.role !== "APPLICANT") redirect("/login")

  const projects = await prisma.project.findMany({
    where: { application: { userId: session.user.id } },
    include: {
      application: {
        select: { id: true, title: true, period: { select: { title: true } }, program: { select: { title: true } } },
      },
      decision: { select: { scope: true, decidedAt: true } },
      reports: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const fmt = (d: Date) =>
    new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="pb-5 border-b border-black/[0.06]">
        <p className="text-[11px] font-semibold text-[#aeaeb2] uppercase tracking-widest mb-2">
          Komünite Üyesi
        </p>
        <h1 className="text-[22px] sm:text-[26px] font-semibold tracking-tight text-[#1c1c1c] leading-none">
          Desteklerim
        </h1>
        <p className="text-[13px] text-[#6e6e73] mt-2">
          {projects.length === 0
            ? "Henüz desteklenen projeniz yok."
            : `${projects.length} aktif proje`}
        </p>
      </div>

      {/* Boş durum */}
      {projects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] p-14 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#f5f5f5] flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-6 h-6 text-[#aeaeb2]" />
          </div>
          <p className="text-[15px] font-semibold text-[#1c1c1c]">Henüz desteklenen başvurunuz yok</p>
          <p className="text-[13px] text-[#6e6e73] mt-1.5 mb-5">
            Başvurunuz desteklendiğinde proje takip alanı burada görünür.
          </p>
          <Link
            href="/dashboard/applications"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#1c1c1c] hover:opacity-80 underline-offset-2 hover:underline transition-all cursor-pointer"
          >
            Başvurularıma git <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {projects.map((p) => {
            const scopeLeft = SCOPE_LEFT[p.decision.scope] ?? "border-l-slate-300"
            const scopeStyle = SCOPE_STYLES[p.decision.scope] ?? "bg-slate-50 text-slate-600"
            const scopeLabel = SCOPE_LABELS[p.decision.scope] ?? p.decision.scope
            return (
              <Link
                key={p.id}
                href={`/dashboard/projects/${p.application.id}`}
                className={`block bg-white rounded-2xl border-l-4 border border-black/[0.06] ${scopeLeft} shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_10px_rgba(0,0,0,0.07)] transition-all duration-200 cursor-pointer`}
              >
                <div className="px-5 py-4 flex items-center gap-4">
                  {/* Scope icon chip */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${scopeStyle}`}>
                    <FolderOpen className="w-4 h-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[14px] font-semibold text-[#1c1c1c] truncate">
                        {p.application.title}
                      </p>
                      <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${scopeStyle}`}>
                        {scopeLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <p className="text-[11px] text-[#aeaeb2]">{p.application.period?.title ?? p.application.program?.title ?? "—"}</p>
                      <span className="w-1 h-1 rounded-full bg-[#d1d1d6]" />
                      <p className="text-[11px] text-[#aeaeb2]">
                        {fmt(p.decision.decidedAt)} kararlandı
                      </p>
                      <span className="w-1 h-1 rounded-full bg-[#d1d1d6]" />
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#aeaeb2]">
                        <FileText className="w-3 h-3" /> {p.reports.length} güncelleme notu
                      </span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <ArrowRight className="w-4 h-4 text-[#d1d1d6] shrink-0" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

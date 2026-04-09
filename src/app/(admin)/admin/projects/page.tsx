import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { FolderOpen, ArrowRight, FileText, Calendar, Send } from "lucide-react"

export const metadata = { title: "Projeler — Mikro Destek Fonu" }

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


export default async function AdminProjectsPage() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") redirect("/login")

  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      application: {
        include: {
          user:   { select: { name: true, email: true } },
          period: { select: { title: true } },
        },
      },
      decision: { select: { scope: true, decidedAt: true } },
      reports:  { select: { id: true } },
      files:    { select: { id: true } },
    },
  })

  const fmt = (d: Date) =>
    new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="pb-5 border-b border-black/[0.06]">
        <h1 className="text-[22px] sm:text-[26px] font-semibold tracking-tight text-[#1c1c1c] leading-none">
          Projeler
        </h1>
        <p className="text-[13px] text-[#6e6e73] mt-2">
          {projects.length === 0
            ? "Henüz proje yok."
            : `${projects.length} desteklenen proje`}
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] p-14 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#f5f5f5] flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-6 h-6 text-[#aeaeb2]" />
          </div>
          <p className="text-[15px] font-semibold text-[#1c1c1c]">Henüz proje yok</p>
          <p className="text-[13px] text-[#6e6e73] mt-1.5 mb-5">
            Başvurulara destek kararı verildikçe projeler burada görünür.
          </p>
          <Link
            href="/admin/applications?status=EVALUATED"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#1c1c1c] hover:opacity-60 transition-opacity cursor-pointer"
          >
            Değerlendirilen başvurulara git <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {projects.map((p) => {
            const scopeStyle = SCOPE_STYLES[p.decision.scope] ?? "bg-slate-50 text-slate-600"
            const scopeLabel = SCOPE_LABELS[p.decision.scope] ?? p.decision.scope
            const scopeDot: Record<string, string> = {
              LIMITED:  "bg-[#fab758]",
              EXTENDED: "bg-blue-400",
              PRIORITY: "bg-emerald-500",
            }
            const dot      = scopeDot[p.decision.scope] ?? "bg-slate-400"
            const isActive = p.status === "ACTIVE"
            const endingSoon = p.supportEndDate
              && (p.supportEndDate.getTime() - Date.now()) < 7 * 24 * 3_600_000
              && isActive

            return (
              <Link
                key={p.id}
                href={`/admin/projects/${p.id}`}
                className="block bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:border-black/[0.1] transition-all duration-200 cursor-pointer p-5 space-y-4"
              >
                {/* Üst satır: ikon + badge'ler */}
                <div className="flex items-start justify-between gap-2">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${scopeStyle}`}>
                    <FolderOpen className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {isActive ? "Aktif" : p.status}
                    </span>
                    {endingSoon && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        Bitiyor
                      </span>
                    )}
                  </div>
                </div>

                {/* Başlık */}
                <div>
                  <p className="text-[14px] font-semibold text-[#1c1c1c] line-clamp-2 leading-snug">
                    {p.application.title}
                  </p>
                  <p className="text-[12px] text-[#6e6e73] mt-1 truncate">
                    {p.application.user.name ?? p.application.user.email}
                  </p>
                </div>

                {/* Alt bilgiler */}
                <div className="space-y-1.5 pt-1 border-t border-black/[0.04]">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
                    <span className={`text-[11px] font-semibold ${scopeStyle.split(" ")[1]}`}>{scopeLabel}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-[#aeaeb2]">
                    <span className="inline-flex items-center gap-1">
                      <Send className="w-3 h-3" /> {p.reports.length} rapor
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <FileText className="w-3 h-3" /> {p.files.length} dosya
                    </span>
                    {p.supportEndDate && (
                      <span className="inline-flex items-center gap-1 ml-auto">
                        <Calendar className="w-3 h-3" /> {fmt(p.supportEndDate)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"

export const metadata = { title: "Projeler — Mikro Destek Fonu" }

const SCOPE_LABELS: Record<string, string> = {
  UNSUPPORTED: "Desteklenmedi",
  LIMITED: "Sınırlı Destek",
  EXTENDED: "Genişletilmiş Destek",
  PRIORITY: "Öncelikli Destek",
}

const SCOPE_COLORS: Record<string, string> = {
  UNSUPPORTED: "bg-red-100 text-red-700",
  LIMITED: "bg-amber-100 text-amber-700",
  EXTENDED: "bg-blue-100 text-blue-700",
  PRIORITY: "bg-green-100 text-green-700",
}

export default async function AdminProjectsPage() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") redirect("/login")

  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      application: {
        include: {
          user: { select: { name: true, email: true } },
          period: { select: { title: true } },
        },
      },
      decision: {
        select: { scope: true, decidedAt: true },
      },
      reports: { select: { id: true } },
    },
  })

  const fmt = (d: Date) =>
    new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Projeler</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Desteklenen başvurulardan oluşturulan aktif projeler
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white border rounded-xl p-10 text-center">
          <p className="text-sm text-muted-foreground">Henüz proje yok.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Başvurulara destek kararı verildikçe projeler burada görünür.
          </p>
          <Link
            href="/admin/applications?status=EVALUATED"
            className="mt-4 inline-block text-sm font-medium text-[#fab758] hover:underline"
          >
            Değerlendirilen başvuruları gör →
          </Link>
        </div>
      ) : (
        <div className="bg-white border rounded-xl divide-y">
          {projects.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-[#f6f7f9] transition-colors">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{p.application.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {p.application.user.name ?? p.application.user.email}
                  {" · "}
                  {p.application.period.title}
                  {" · "}
                  {fmt(p.decision.decidedAt)} tarihinde kararlandı
                  {" · "}
                  {p.reports.length} rapor
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    SCOPE_COLORS[p.decision.scope] ?? "bg-slate-100 text-slate-700"
                  }`}
                >
                  {SCOPE_LABELS[p.decision.scope] ?? p.decision.scope}
                </span>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    p.status === "ACTIVE"
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {p.status === "ACTIVE" ? "Aktif" : p.status}
                </span>
                <Link
                  href={`/admin/applications/${p.application.id}`}
                  className="text-xs font-medium text-[#fab758] hover:underline"
                >
                  Başvuruya Git →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

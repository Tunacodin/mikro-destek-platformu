import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { JuryAssignPanel } from "@/components/admin/JuryAssignPanel"
import type { ApplicationStatus } from "@prisma/client"

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  DRAFT: "Taslak", SUBMITTED: "Gönderildi", IN_REVIEW: "İncelemede",
  EVALUATED: "Değerlendirildi", SUPPORTED: "Desteklendi", REJECTED: "Reddedildi",
}
const STATUS_COLORS: Record<ApplicationStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700", SUBMITTED: "bg-blue-100 text-blue-700",
  IN_REVIEW: "bg-amber-100 text-amber-700", EVALUATED: "bg-purple-100 text-purple-700",
  SUPPORTED: "bg-green-100 text-green-700", REJECTED: "bg-red-100 text-red-700",
}

export default async function AdminApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") redirect("/login")

  const { id } = await params

  const [application, juryMembers] = await Promise.all([
    prisma.application.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        period: { select: { title: true, endDate: true } },
        files: { select: { id: true, name: true, size: true, mimeType: true } },
        juryAssignments: { include: { jury: { select: { id: true, name: true, email: true } } } },
        evaluation: { include: { scores: true, jury: { select: { name: true, email: true } } } },
      },
    }),
    prisma.user.findMany({
      where: { role: "JURY" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ])

  if (!application) notFound()

  const fmt = (d: Date) =>
    new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })

  const avgScore =
    application.evaluation?.scores.length
      ? application.evaluation.scores.reduce((s, e) => s + e.score, 0) /
        application.evaluation.scores.length
      : null

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Başlık */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{application.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {application.user.name ?? application.user.email} · {application.period.title}
          </p>
        </div>
        <span className={`text-sm font-medium px-3 py-1 rounded-full shrink-0 ${STATUS_COLORS[application.status]}`}>
          {STATUS_LABELS[application.status]}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol — Detaylar */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white border rounded-lg p-5">
            <h2 className="font-semibold mb-3 text-sm">Proje Açıklaması</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{application.description}</p>
          </div>

          <div className="bg-white border rounded-lg p-5">
            <h2 className="font-semibold mb-3 text-sm">Belgeler ({application.files.length})</h2>
            {application.files.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belge yüklenmemiş.</p>
            ) : (
              <ul className="divide-y">
                {application.files.map((f) => (
                  <li key={f.id} className="py-2 flex items-center justify-between">
                    <span className="text-sm truncate">{f.name}</span>
                    <a
                      href={`/api/files/${f.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-slate-600 underline underline-offset-2 ml-4 shrink-0"
                    >
                      İndir
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Değerlendirme sonucu */}
          {application.evaluation && (
            <div className="bg-white border rounded-lg p-5">
              <h2 className="font-semibold mb-3 text-sm">
                Değerlendirme — {application.evaluation.jury.name ?? application.evaluation.jury.email}
              </h2>
              {avgScore !== null && (
                <ScoreBand score={avgScore} />
              )}
              <div className="mt-4 space-y-2">
                {application.evaluation.scores.map((s) => (
                  <div key={s.id} className="text-sm">
                    <p className="font-medium">{s.criteria} — <span className="text-slate-500">{s.score}/5</span></p>
                    <p className="text-muted-foreground text-xs mt-0.5">{s.justification}</p>
                  </div>
                ))}
              </div>
              {application.evaluation.comment && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground">Genel Yorum</p>
                  <p className="text-sm mt-1">{application.evaluation.comment}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sağ — Jüri Atama */}
        <div className="space-y-5">
          <JuryAssignPanel
            applicationId={application.id}
            applicationStatus={application.status}
            assignedJuries={application.juryAssignments.map((a) => a.jury)}
            allJuries={juryMembers}
          />
        </div>
      </div>
    </div>
  )
}

function ScoreBand({ score }: { score: number }) {
  const bands = [
    { max: 2.0, label: "Desteklenemez", color: "bg-red-500" },
    { max: 3.0, label: "Sınırlı Destek", color: "bg-orange-400" },
    { max: 4.0, label: "Genişletilmiş Destek", color: "bg-yellow-400" },
    { max: 5.1, label: "Öncelikli Destek", color: "bg-green-500" },
  ]
  const band = bands.find((b) => score < b.max) ?? bands[3]
  const pct = Math.round((score / 5) * 100)

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium">{band.label}</span>
        <span className="text-sm text-muted-foreground">{score.toFixed(2)} / 5</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${band.color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

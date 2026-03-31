import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { EvaluationForm } from "@/components/jury/EvaluationForm"

export const metadata = { title: "Değerlendirme — Mikro Destek Fonu" }

export default async function JuryEvaluatePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session || session.user.role !== "JURY") redirect("/login")

  const { id } = await params
  const juryId = session.user.id

  // Atama kontrolü
  const assignment = await prisma.juryAssignment.findUnique({
    where: { juryId_applicationId: { juryId, applicationId: id } },
  })
  if (!assignment) notFound()

  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
      period: { select: { title: true, endDate: true } },
      files: {
        select: { id: true, name: true, size: true, mimeType: true },
        orderBy: { createdAt: "asc" },
      },
      evaluation: {
        include: { scores: true },
      },
    },
  })
  if (!application) notFound()

  const canEvaluate = application.status === "IN_REVIEW"

  return (
    <div className="h-full flex flex-col">
      {/* Başlık */}
      <div className="shrink-0 px-6 py-4 border-b bg-white flex items-start justify-between gap-4">
        <div>
          <h1 className="font-bold text-lg leading-tight">{application.title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {application.user.name ?? application.user.email} · {application.period.title}
          </p>
        </div>
        {!canEvaluate && (
          <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium shrink-0">
            Değerlendirildi
          </span>
        )}
      </div>

      {/* Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sol Panel — Dosyalar ve Açıklama */}
        <div className="w-1/2 border-r overflow-y-auto p-6 space-y-5">
          <section>
            <h2 className="text-sm font-semibold mb-2">Proje Açıklaması</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {application.description}
            </p>
          </section>

          <section>
            <h2 className="text-sm font-semibold mb-2">
              Belgeler ({application.files.length})
            </h2>
            {application.files.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belge yüklenmemiş.</p>
            ) : (
              <ul className="divide-y border rounded-lg overflow-hidden">
                {application.files.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center justify-between px-4 py-2.5 bg-white hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="text-sm truncate">{f.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(f.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                    <a
                      href={`/api/files/${f.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-slate-600 underline underline-offset-2 ml-4 shrink-0"
                    >
                      Aç
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Sağ Panel — Değerlendirme Formu */}
        <div className="w-1/2 overflow-y-auto p-6">
          <EvaluationForm
            applicationId={application.id}
            canEvaluate={canEvaluate}
            existingEvaluation={application.evaluation}
          />
        </div>
      </div>
    </div>
  )
}

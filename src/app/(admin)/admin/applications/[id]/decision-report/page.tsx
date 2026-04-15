import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { DecisionReportClient } from "./DecisionReportClient"

export const metadata = { title: "Destek Sonuç Bildirimi — Mikro Destek Fonu" }

const BORDER   = "#c8c8c8"
const LABEL_BG = "#f5f5f5"

function fmtLong(d: Date) {
  return new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
}

export default async function DecisionReportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") redirect("/login")

  const { id } = await params

  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      user:    { select: { name: true, email: true } },
      period:  { select: { title: true } },
      program: { select: { title: true } },
      decision: {
        select: {
          id: true,
          scope: true,
          notes: true,
          decidedAt: true,
          strategicReason: true,
          expectedOutputs: true,
          supportDuration: true,
          additionalConditions: true,
          riskFramework: true,
          decidedBy: { select: { name: true, email: true } },
        },
      },
      evaluations: {
        include: {
          scores: true,
          jury: { select: { name: true, email: true } },
        },
      },
    },
  })

  if (!application || !application.decision) notFound()

  const juryTotals = application.evaluations.map((ev) =>
    ev.scores.reduce((s, e) => s + e.score, 0)
  )
  const avgTotal = juryTotals.length
    ? juryTotals.reduce((a, b) => a + b, 0) / juryTotals.length
    : null

  const juryNames     = application.evaluations.map((e) => e.jury.name ?? e.jury.email).join(", ")
  const decisionDate  = fmtLong(application.decision.decidedAt)
  const submittedDate = application.submittedAt ? fmtLong(application.submittedAt) : "—"
  const authorName    = application.decision.decidedBy?.name ?? application.decision.decidedBy?.email ?? "—"

  return (
    <>
      <style>{`
        .print-val { display: none; }

        @media print {
          html, body   { margin: 0; padding: 0; }
          body         { -webkit-print-color-adjust: exact; print-color-adjust: exact; font-size: 11px; }
          .no-print    { display: none !important; }
          .print-hide  { display: none !important; }
          .print-val   { display: block !important; }
          .print-break { page-break-before: always; break-before: page; }
          .report-wrap { max-width: none !important; padding: 0 !important; margin: 0 !important; }
          table        { border-collapse: collapse; width: 100%; }
          td, th       { border-color: ${BORDER} !important; }
        }

        @page { margin: 20mm; }
      `}</style>

      <div className="report-wrap max-w-3xl mx-auto px-4 py-6 sm:py-10">
        <DecisionReportClient
          decisionId={application.decision.id}
          approvedSupportTypes={application.supportTypes}
          border={BORDER}
          labelBg={LABEL_BG}
          initial={{
            /* Sayfa 1 — oturum içinde düzenlenebilir */
            projectTitle:  application.title,
            applicantName: application.user.name ?? application.user.email,
            applicationId: application.id,
            submittedDate,
            juryNames,
            avgScore:    avgTotal !== null ? `${avgTotal.toFixed(1)} / 40` : "—",
            scope:       application.decision.scope,
            authorName,
            decisionDate,
            /* Sayfa 2 — veritabanına kaydedilir */
            strategicReason:      application.decision.strategicReason      ?? "",
            expectedOutputs:      application.decision.expectedOutputs      ?? "",
            supportDuration:      application.decision.supportDuration      ?? "",
            additionalConditions: application.decision.additionalConditions ?? "",
            riskFramework:        application.decision.riskFramework        ?? "",
          }}
        />
      </div>
    </>
  )
}

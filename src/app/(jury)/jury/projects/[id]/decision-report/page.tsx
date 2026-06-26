import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { DecisionReportView } from "@/components/decision/DecisionReportView"

export const metadata = { title: "Destek Sonuç Bildirimi — Mikro Destek Fonu" }

function fmtLong(d: Date) {
  return new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
}

export default async function JuryDecisionReportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session || session.user.role !== "JURY") redirect("/login")

  const { id: applicationId } = await params
  const juryId = session.user.id

  // Erişim: jüri bu başvuruya atanmış olmalı
  const assignment = await prisma.juryAssignment.findUnique({
    where: { juryId_applicationId: { juryId, applicationId } },
  })
  if (!assignment) notFound()

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      user: { select: { name: true, email: true } },
      decision: {
        select: {
          scope: true,
          decidedAt: true,
          strategicReason: true,
          approvedConditionalSupports: true,
          expectedOutputs: true,
          supportDuration: true,
          monitoringObligations: true,
          riskFramework: true,
          decidedBy: { select: { name: true, email: true } },
        },
      },
      evaluations: {
        include: {
          scores: { select: { score: true } },
          jury: { select: { name: true, email: true } },
        },
      },
    },
  })

  if (!application || !application.decision) notFound()

  const d = application.decision
  const juryTotals = application.evaluations.map((ev) => ev.scores.reduce((s, e) => s + e.score, 0))
  const avgTotal = juryTotals.length ? juryTotals.reduce((a, b) => a + b, 0) / juryTotals.length : null

  return (
    <div className="report-wrap max-w-3xl mx-auto px-4 py-6 sm:py-10 space-y-6">
      <Link
        href={`/jury/projects/${applicationId}`}
        className="no-print inline-flex items-center gap-1.5 text-[13px] text-[#6e6e73] hover:text-[#1c1c1c] transition-colors cursor-pointer"
      >
        <ChevronLeft className="w-3.5 h-3.5" /> Projeye dön
      </Link>

      <DecisionReportView
        data={{
          projectTitle: application.title,
          applicantName: application.user.name ?? application.user.email,
          applicationId: application.id,
          submittedDate: application.submittedAt ? fmtLong(application.submittedAt) : "—",
          juryNames: application.evaluations.map((e) => e.jury.name ?? e.jury.email).join(", "),
          avgScore: avgTotal !== null ? `${avgTotal.toFixed(1)} / 40` : "—",
          scope: d.scope,
          authorName: d.decidedBy?.name ?? d.decidedBy?.email ?? "—",
          decisionDate: fmtLong(d.decidedAt),
          strategicReason: d.strategicReason ?? "",
          approvedConditionalSupports: d.approvedConditionalSupports ?? "",
          expectedOutputs: d.expectedOutputs ?? "",
          supportDuration: d.supportDuration ?? "",
          monitoringObligations: d.monitoringObligations ?? "",
          riskFramework: d.riskFramework ?? "",
        }}
      />
    </div>
  )
}

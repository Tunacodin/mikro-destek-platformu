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

export default async function ApplicantDecisionReportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session || session.user.role !== "APPLICANT") redirect("/login")

  const { id: applicationId } = await params

  // Not: başvuran jüri değerlendirmelerini ve ortalama puanı GÖRMEZ — bu alanlar sorgulanmaz.
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      user: { select: { id: true, name: true, email: true } },
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
    },
  })

  // Erişim: yalnızca kendi başvurusu + kararı verilmiş olmalı
  if (!application || application.user.id !== session.user.id || !application.decision) notFound()

  const d = application.decision

  return (
    <div className="report-wrap max-w-3xl mx-auto px-4 py-6 sm:py-10 space-y-6">
      <Link
        href={`/dashboard/projects/${applicationId}`}
        className="no-print inline-flex items-center gap-1.5 text-[13px] text-[#6e6e73] hover:text-[#1c1c1c] transition-colors cursor-pointer"
      >
        <ChevronLeft className="w-3.5 h-3.5" /> Projeye dön
      </Link>

      <DecisionReportView
        showEvaluation={false}
        data={{
          projectTitle: application.title,
          applicantName: application.user.name ?? application.user.email,
          applicationId: application.id,
          submittedDate: application.submittedAt ? fmtLong(application.submittedAt) : "—",
          juryNames: "",
          avgScore: "",
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

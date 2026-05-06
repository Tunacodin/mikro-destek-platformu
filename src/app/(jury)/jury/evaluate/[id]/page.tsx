import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { JuryEvaluateClient } from "./JuryEvaluateClient"

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

  const assignment = await prisma.juryAssignment.findUnique({
    where: { juryId_applicationId: { juryId, applicationId: id } },
  })
  if (!assignment) notFound()

  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
      period:  { select: { title: true, endDate: true } },
      program: { select: { title: true, endDate: true } },
      files: {
        select: { id: true, name: true, size: true, mimeType: true, type: true, url: true },
        orderBy: { createdAt: "asc" },
      },
      evaluations: { where: { juryId }, include: { scores: true }, take: 1 },
    },
  })
  if (!application) notFound()

  // Jüri her zaman değerlendirebilir / düzenleyebilir;
  // sadece admin `evaluationsLocked` ile bu yetkiyi kapatıp açabilir.
  const canEvaluate = !application.evaluationsLocked

  return (
    <JuryEvaluateClient
      application={{
        id: application.id,
        title: application.title,
        summary: application.summary,
        teamName: application.teamName,
        teamInfo: application.teamInfo,
        targetAudience: application.targetAudience,
        categories: application.categories,
        technologyStage: application.technologyStage,
        artStage: application.artStage,
        researchStage: application.researchStage,
        problemStatement: application.problemStatement,
        solution: application.solution,
        innovation: application.innovation,
        outputs: application.outputs,
        timeline: application.timeline,
        successCriteria: application.successCriteria,
        ecosystemCollaboration: application.ecosystemCollaboration,
        communityContribution: application.communityContribution,
        divisionContribution: application.divisionContribution,
        supportTypes: application.supportTypes,
        supportNotes: application.supportNotes as Record<string, string> | null,
      }}
      applicant={{
        name: application.user.name,
        email: application.user.email,
      }}
      period={{
        title: application.period?.title ?? application.program?.title ?? "—",
        endDate: (application.period?.endDate ?? application.program?.endDate ?? new Date()).toISOString(),
      }}
      files={application.files}
      canEvaluate={canEvaluate}
      assignedAt={assignment.assignedAt.toISOString()}
      presentationDate={application.presentationDate?.toISOString() ?? null}
      existingEvaluation={application.evaluations[0] ? {
        id: application.evaluations[0].id,
        comment: application.evaluations[0].comment,
        scores: application.evaluations[0].scores.map((s) => ({
          id: s.id,
          criteria: s.criteria,
          score: s.score,
          justification: s.justification,
        })),
      } : null}
    />
  )
}

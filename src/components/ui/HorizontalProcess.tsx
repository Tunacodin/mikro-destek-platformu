import { CheckCircle2, Circle, Clock, XCircle } from "lucide-react"
import type { ApplicationStatus } from "@prisma/client"

const STEPS = [
  { id: "1", label: "Başvuru" },
  { id: "2", label: "Ön Değerlendirme" },
  { id: "3", label: "Jüri Ataması" },
  { id: "4", label: "Jüri Değerlendirmesi" },
  { id: "5", label: "Sonuç" },
]

function getStepIndex(status: ApplicationStatus, hasJury: boolean, hasEvaluation: boolean): number {
  switch (status) {
    case "DRAFT":      return 0
    case "SUBMITTED":  return 1
    case "IN_REVIEW":
      if (hasEvaluation) return 3
      if (hasJury)       return 3
      return 2
    case "EVALUATED":  return 4
    case "SUPPORTED":  return 5
    case "REJECTED":   return 5
  }
}

export function HorizontalProcess({
  status,
  hasJury = false,
  hasEvaluation = false,
}: {
  status: ApplicationStatus
  hasJury?: boolean
  hasEvaluation?: boolean
}) {
  const current = getStepIndex(status, hasJury, hasEvaluation)
  const isRejected = status === "REJECTED"
  const isComplete = status === "SUPPORTED" || status === "REJECTED"

  return (
    <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.04)] px-6 py-5">
      <div className="flex items-center">
        {STEPS.map((step, i) => {
          const isDone = i < current
          const isActive = i === current && !isComplete
          const isFinal = i === STEPS.length - 1 && isComplete

          let Icon = Circle
          let dotCls = "bg-white border-[#e0e0e0] text-[#d1d1d6]"
          let labelCls = "text-[#aeaeb2]"
          let lineCls = "bg-[#e0e0e0]"

          if (isFinal) {
            if (isRejected) {
              Icon = XCircle
              dotCls = "bg-red-100 border-red-200 text-red-500"
              labelCls = "text-red-600 font-semibold"
            } else {
              Icon = CheckCircle2
              dotCls = "bg-emerald-100 border-emerald-200 text-emerald-600"
              labelCls = "text-emerald-700 font-semibold"
            }
          } else if (isDone) {
            Icon = CheckCircle2
            dotCls = "bg-[#1c1c1c] border-[#1c1c1c] text-white"
            labelCls = "text-[#1c1c1c] font-medium"
            lineCls = "bg-[#1c1c1c]"
          } else if (isActive) {
            Icon = Clock
            dotCls = "bg-[#fab758] border-[#fab758] text-white shadow-[0_0_0_3px_rgba(250,183,88,0.2)]"
            labelCls = "text-[#1c1c1c] font-semibold"
          }

          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              {/* Step */}
              <div className="flex flex-col items-center gap-2">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${dotCls}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className={`text-[11px] transition-colors whitespace-nowrap ${labelCls}`}>
                  {step.label}
                </span>
              </div>

              {/* Çizgi */}
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mt-[-20px] rounded-full transition-all ${
                  isDone ? "bg-[#1c1c1c]" : "bg-[#e0e0e0]"
                }`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

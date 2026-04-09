import { CheckCircle2, Circle, Clock, XCircle } from "lucide-react"
import type { ApplicationStatus } from "@prisma/client"

type Stage = {
  id: string
  label: string
  shortLabel: string
  description: string
}

const STAGES: Stage[] = [
  {
    id: "2",
    label: "İlk Başvuru",
    shortLabel: "Başvuru",
    description: "Form dolduruldu, dosyalar yüklendi",
  },
  {
    id: "3",
    label: "Ön Değerlendirme",
    shortLabel: "Ön Değ.",
    description: "Admin ön değerlendirmesi",
  },
  {
    id: "4",
    label: "Jüri Ataması",
    shortLabel: "Jüri",
    description: "Jüri atandı, brifing iletildi",
  },
  {
    id: "5a",
    label: "Final Değerlendirme",
    shortLabel: "Değerlendirme",
    description: "Jüri puanlama ve yorum",
  },
  {
    id: "5b",
    label: "Sonuç",
    shortLabel: "Sonuç",
    description: "Destek kararı",
  },
]

function getStageIndex(
  status: ApplicationStatus,
  hasJury: boolean,
  hasEvaluation: boolean
): number {
  switch (status) {
    case "DRAFT":      return 0 // Aşama 2 başlamadan
    case "SUBMITTED":  return 1 // Aşama 3'te bekliyor
    case "IN_REVIEW":
      if (hasEvaluation) return 3 // 5a'da
      if (hasJury)       return 3 // 4/5a arasında
      return 2                   // Aşama 4
    case "EVALUATED":  return 4 // 5b'de
    case "SUPPORTED":  return 5 // Tamamlandı — desteklendi
    case "REJECTED":   return 5 // Tamamlandı — reddedildi
  }
}

export function ProcessTracker({
  status,
  hasJury = false,
  hasEvaluation = false,
}: {
  status: ApplicationStatus
  hasJury?: boolean
  hasEvaluation?: boolean
}) {
  const currentIndex = getStageIndex(status, hasJury, hasEvaluation)
  const isRejected = status === "REJECTED"
  const isComplete = status === "SUPPORTED" || status === "REJECTED"

  return (
    <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] p-5 sm:p-6">
      <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-[0.12em] mb-5">
        Süreç Aşamaları
      </p>

      <div className="relative">
        {/* Bağlantı çizgisi */}
        <div className="absolute left-[15px] top-4 bottom-4 w-px bg-black/[0.06]" />

        <div className="space-y-1">
          {STAGES.map((stage, i) => {
            const isDone    = i < currentIndex
            const isActive  = i === currentIndex && !isComplete
            const isPending = i > currentIndex

            // Son aşama (Sonuç) için özel durum
            const isFinalComplete = i === STAGES.length - 1 && isComplete

            let dotClass = ""
            let labelClass = ""
            let descClass = ""
            let Icon = Circle

            if (isFinalComplete) {
              if (isRejected) {
                dotClass = "bg-red-100 text-red-500 border-red-200"
                labelClass = "text-red-600 font-semibold"
                descClass = "text-red-500"
                Icon = XCircle
              } else {
                dotClass = "bg-emerald-100 text-emerald-600 border-emerald-200"
                labelClass = "text-emerald-700 font-semibold"
                descClass = "text-emerald-600"
                Icon = CheckCircle2
              }
            } else if (isDone) {
              dotClass = "bg-[#1c1c1c] text-white border-[#1c1c1c]"
              labelClass = "text-[#1c1c1c] font-semibold"
              descClass = "text-[#6e6e73]"
              Icon = CheckCircle2
            } else if (isActive) {
              dotClass = "bg-[#fab758] text-white border-[#fab758] shadow-[0_0_0_3px_rgba(250,183,88,0.2)]"
              labelClass = "text-[#1c1c1c] font-semibold"
              descClass = "text-[#6e6e73]"
              Icon = Clock
            } else {
              dotClass = "bg-white text-[#d1d1d6] border-[#e5e5e5]"
              labelClass = "text-[#aeaeb2]"
              descClass = "text-[#c7c7cc]"
              Icon = Circle
            }

            return (
              <div key={stage.id} className="flex items-start gap-4 py-2.5 relative z-10">
                {/* Dot */}
                <div className={`w-[30px] h-[30px] rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${dotClass}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>

                {/* Content */}
                <div className="min-w-0 pt-0.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider text-[#aeaeb2]`}>
                      {stage.id}
                    </span>
                    <span className={`text-[13px] transition-colors ${labelClass}`}>
                      {stage.label}
                    </span>
                    {isActive && (
                      <span className="text-[10px] font-semibold bg-[#fab758]/10 text-[#fab758] px-2 py-0.5 rounded-full">
                        Aktif
                      </span>
                    )}
                    {isFinalComplete && !isRejected && (
                      <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                        Desteklendi
                      </span>
                    )}
                    {isFinalComplete && isRejected && (
                      <span className="text-[10px] font-semibold bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                        Reddedildi
                      </span>
                    )}
                  </div>
                  <p className={`text-[11px] mt-0.5 transition-colors ${descClass}`}>
                    {stage.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

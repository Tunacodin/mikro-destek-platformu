"use client"

import { useState } from "react"
import { MessageSquare } from "lucide-react"

const CRITERIA_LABELS: Record<string, string> = {
  innovation:   "Yenilikçilik ve Özgünlük",
  feasibility:  "Uygulanabilirlik ve Olgunluk",
  community:    "Topluluk Katkısı",
  ecosystem:    "Ekosistem ve Toplumsal Etki",
  resource:     "Kaynak Uygunluğu ve Verimlilik",
  output:       "Çıktı ve Sonuç Potansiyeli",
  visibility:   "Görünürlük ve İtibar Katkısı",
  bonus:        "Bonus: Motivasyon & Sunum",
  impact:       "Etki Potansiyeli",
  team:         "Ekip Yetkinliği",
  sustainability:"Sürdürülebilirlik",
}
const CRITERIA_ORDER = [
  "innovation", "feasibility", "community", "ecosystem",
  "resource", "output", "visibility", "bonus",
]
const SCORE_BANDS = [
  { max: 23, label: "Desteklenemez",        bar: "bg-red-400",     text: "text-red-600",     bg: "bg-red-50",     border: "border-red-100" },
  { max: 27, label: "Sınırlı Destek",       bar: "bg-orange-400",  text: "text-orange-600",  bg: "bg-orange-50",  border: "border-orange-100" },
  { max: 31, label: "Genişletilmiş Destek", bar: "bg-[#fab758]",   text: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-100" },
  { max: 41, label: "Öncelikli Destek",     bar: "bg-emerald-400", text: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
]

type Score = {
  id: string
  criteria: string
  score: number
  justification: string
}
type Jury = { id: string; name: string | null; email: string }
type Evaluation = {
  id: string
  comment: string | null
  jury: Jury
  scores: Score[]
}

export function JuryEvaluationTabs({
  evaluations,
  avgTotal,
  band,
  criteriaAvg,
}: {
  evaluations: Evaluation[]
  avgTotal: number | null
  band: typeof SCORE_BANDS[number] | null
  criteriaAvg: Record<string, number | null>
}) {
  const [activeId, setActiveId] = useState(evaluations[0]?.id ?? "")
  const active = evaluations.find((e) => e.id === activeId) ?? evaluations[0]

  if (!active) return null

  const activeTotal = active.scores.reduce((s, e) => s + e.score, 0)
  const activeBand = SCORE_BANDS.find((b) => activeTotal < b.max) ?? SCORE_BANDS[3]

  return (
    <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] overflow-hidden">

      {/* Header */}
      <div className="px-5 py-4 border-b border-black/[0.04] flex items-center justify-between">
        <p className="text-[13px] font-semibold text-[#1c1c1c]">Jüri Değerlendirmeleri</p>
        <span className="text-[11px] font-semibold text-[#aeaeb2] bg-[#f5f5f5] px-2.5 py-1 rounded-full">
          {evaluations.length} jüri
        </span>
      </div>

      {/* Ortalama puan */}
      {band && avgTotal !== null && (
        <div className="px-5 pt-5">
          <div className={`rounded-xl border ${band.border} ${band.bg} px-4 py-4`}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-wider mb-0.5">Ortalama Toplam Puan</p>
                <span className={`text-[14px] font-bold ${band.text}`}>{band.label}</span>
              </div>
              <span className={`text-[28px] font-bold tabular-nums ${band.text}`}>
                {avgTotal.toFixed(1)}
                <span className="text-[14px] font-normal opacity-60">/40</span>
              </span>
            </div>
            <div className="h-2 bg-black/[0.07] rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${band.bar}`} style={{ width: `${Math.min(100, (avgTotal / 40) * 100)}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Kriter dağılımı (ortalama) */}
      <div className="px-5 pt-4 pb-2 space-y-3">
        <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-wider">Kriter Dağılımı (Ortalama)</p>
        <div className="space-y-2.5">
          {CRITERIA_ORDER.map((criterion) => {
            const avg = criteriaAvg[criterion]
            if (avg === null) return null
            const juryScores = evaluations.map((ev) => ({
              jury: ev.jury,
              score: ev.scores.find((s) => s.criteria === criterion)?.score ?? null,
            }))
            return (
              <div key={criterion} className="flex items-center gap-3">
                <p className="text-[11px] font-medium text-[#1c1c1c] w-36 shrink-0 leading-snug">
                  {CRITERIA_LABELS[criterion]}
                </p>
                <div className="flex-1 h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-[#fab758]" style={{ width: `${(avg / 5) * 100}%` }} />
                </div>
                <span className="text-[12px] font-semibold text-[#1c1c1c] tabular-nums w-8 text-right">{avg.toFixed(1)}</span>
                <div className="flex items-center gap-1">
                  {juryScores.map(({ jury, score }) =>
                    score !== null ? (
                      <span
                        key={jury.id}
                        title={jury.name ?? jury.email}
                        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#f0f0f0] text-[10px] font-bold text-[#6e6e73]"
                      >
                        {score}
                      </span>
                    ) : null
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Jüri tabları */}
      <div className="mt-4 border-t border-black/[0.06]">
        {/* Tab bar */}
        <div className="flex overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {evaluations.map((ev) => {
            const total = ev.scores.reduce((s, e) => s + e.score, 0)
            const b = SCORE_BANDS.find((b) => total < b.max) ?? SCORE_BANDS[3]
            const isActive = ev.id === activeId
            return (
              <button
                key={ev.id}
                onClick={() => setActiveId(ev.id)}
                className={`shrink-0 px-4 py-3 text-[12px] font-medium transition-colors cursor-pointer whitespace-nowrap border-b-2 -mb-px flex items-center gap-2 ${
                  isActive
                    ? "border-[#fab758] text-[#1c1c1c]"
                    : "border-transparent text-[#6e6e73] hover:text-[#1c1c1c]"
                }`}
              >
                {ev.jury.name ?? ev.jury.email}
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${b.bg} ${b.text}`}>
                  {total}/40
                </span>
              </button>
            )
          })}
        </div>

        {/* Tab içeriği */}
        <div className="p-5 space-y-4">

          {/* Seçili jürinin toplam skoru */}
          <div className={`rounded-xl border ${activeBand.border} ${activeBand.bg} px-4 py-3 flex items-center justify-between`}>
            <span className={`text-[13px] font-semibold ${activeBand.text}`}>{activeBand.label}</span>
            <span className={`text-[20px] font-bold tabular-nums ${activeBand.text}`}>
              {activeTotal}
              <span className="text-[12px] font-normal opacity-60">/40</span>
            </span>
          </div>

          {/* Genel yorum */}
          {active.comment && (
            <div className="flex items-start gap-2.5 bg-[#f9f9f9] rounded-xl px-4 py-3">
              <MessageSquare className="w-3.5 h-3.5 text-[#aeaeb2] shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-wider mb-1">Genel Yorum</p>
                <p className="text-[13px] text-[#1c1c1c] leading-relaxed">{active.comment}</p>
              </div>
            </div>
          )}

          {/* Kriter gerekçeleri */}
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-wider mb-2">Kriter Gerekçeleri</p>
            <div className="rounded-xl border border-black/[0.06] divide-y divide-black/[0.04] overflow-hidden">
              {CRITERIA_ORDER
                .map((criterion) => active.scores.find((s) => s.criteria === criterion))
                .filter(Boolean)
                .map((s) => (
                  <div key={s!.id} className="px-4 py-3 flex gap-4">
                    <div className="shrink-0 w-28">
                      <div className="flex items-baseline gap-1">
                        <span className="text-[14px] font-bold tabular-nums text-[#1c1c1c]">{s!.score}</span>
                        <span className="text-[11px] text-[#aeaeb2]">/5</span>
                      </div>
                      <p className="text-[10px] text-[#6e6e73] leading-snug mt-0.5">
                        {CRITERIA_LABELS[s!.criteria] ?? s!.criteria}
                      </p>
                    </div>
                    <p className="text-[12px] text-[#6e6e73] leading-relaxed flex-1">{s!.justification}</p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const CRITERIA = [
  { key: "innovation", label: "Yenilikçilik" },
  { key: "impact", label: "Etki Potansiyeli" },
  { key: "feasibility", label: "Uygulanabilirlik" },
  { key: "team", label: "Ekip Yetkinliği" },
  { key: "sustainability", label: "Sürdürülebilirlik" },
]

type ExistingScore = { id: string; criteria: string; score: number; justification: string }
type ExistingEvaluation = {
  id: string
  comment: string | null
  scores: ExistingScore[]
} | null

type ScoreEntry = {
  score: number
  justification: string
}

const SCORE_BANDS = [
  { max: 2.0, label: "Desteklenemez", barColor: "bg-red-400", textColor: "text-red-600", bgColor: "bg-red-50" },
  { max: 3.0, label: "Sınırlı Destek", barColor: "bg-orange-400", textColor: "text-orange-600", bgColor: "bg-orange-50" },
  { max: 4.0, label: "Genişletilmiş Destek", barColor: "bg-[#fab758]", textColor: "text-amber-600", bgColor: "bg-amber-50" },
  { max: 5.1, label: "Öncelikli Destek", barColor: "bg-emerald-400", textColor: "text-emerald-600", bgColor: "bg-emerald-50" },
]

function getBand(score: number) {
  return SCORE_BANDS.find((b) => score < b.max) ?? SCORE_BANDS[3]
}

export function EvaluationForm({
  applicationId,
  canEvaluate,
  existingEvaluation,
}: {
  applicationId: string
  canEvaluate: boolean
  existingEvaluation: ExistingEvaluation
}) {
  const router = useRouter()

  const initScores = (): Record<string, ScoreEntry> => {
    const base: Record<string, ScoreEntry> = {}
    for (const c of CRITERIA) {
      const ex = existingEvaluation?.scores.find((s) => s.criteria === c.key)
      base[c.key] = { score: ex?.score ?? 0, justification: ex?.justification ?? "" }
    }
    return base
  }

  const [scores, setScores] = useState<Record<string, ScoreEntry>>(initScores)
  const [comment, setComment] = useState(existingEvaluation?.comment ?? "")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const filledScores = CRITERIA.filter((c) => scores[c.key].score > 0)
  const avgScore =
    filledScores.length > 0
      ? filledScores.reduce((s, c) => s + scores[c.key].score, 0) / filledScores.length
      : null
  const allFilled =
    CRITERIA.every((c) => scores[c.key].score > 0) &&
    CRITERIA.every((c) => scores[c.key].justification.trim().length >= 10)

  function updateScore(key: string, field: keyof ScoreEntry, value: string | number) {
    setScores((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }))
    setSuccess(false)
  }

  async function submit() {
    if (!allFilled) return
    setSubmitting(true)
    setError(null)

    const payload = {
      applicationId,
      comment: comment.trim() || undefined,
      scores: CRITERIA.map((c) => ({
        criteria: c.key,
        score: scores[c.key].score,
        justification: scores[c.key].justification.trim(),
      })),
    }

    const res = await fetch("/api/jury/evaluations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? "Bir hata oluştu.")
    } else {
      setSuccess(true)
      router.refresh()
    }
    setSubmitting(false)
  }

  return (
    <div className="space-y-5">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-[0.12em]">Değerlendirme Cetveli</p>
        {existingEvaluation && (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${canEvaluate ? "bg-amber-50 text-amber-600" : "bg-purple-50 text-purple-600"}`}>
            {canEvaluate ? "Düzenleniyor" : "Salt Okunur"}
          </span>
        )}
      </div>

      {/* Anlık Ortalama */}
      {avgScore !== null && (
        <ScoreBand score={avgScore} filled={filledScores.length} total={CRITERIA.length} />
      )}

      {/* Kriterler */}
      <div className="space-y-4">
        {CRITERIA.map((c) => {
          const entry = scores[c.key]
          const hasScore = entry.score > 0
          const hasJustification = entry.justification.trim().length >= 10
          const justTooShort = !hasJustification && entry.justification.length > 0

          return (
            <div key={c.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-semibold text-[#1c1c1c]">{c.label}</label>
                {hasScore && (
                  <span className="text-[11px] font-medium text-[#6e6e73] tabular-nums">{entry.score} / 5</span>
                )}
              </div>

              {/* Puan Seçimi */}
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    disabled={!canEvaluate}
                    onClick={() => updateScore(c.key, "score", n)}
                    className={`w-10 h-10 rounded-xl text-[13px] font-semibold transition-all
                      ${entry.score === n
                        ? "bg-[#fab758] text-white shadow-[0_2px_8px_rgba(250,183,88,0.4)]"
                        : "bg-[#f5f5f5] text-[#6e6e73] hover:bg-[#ebebeb]"
                      }
                      disabled:cursor-default disabled:opacity-50`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              {/* Gerekçe */}
              <textarea
                disabled={!canEvaluate}
                value={entry.justification}
                onChange={(e) => updateScore(c.key, "justification", e.target.value)}
                placeholder="Gerekçe (en az 10 karakter)…"
                rows={2}
                className={`w-full px-3 py-2 bg-[#f5f5f5] border-0 rounded-xl text-[12px] text-[#1c1c1c] placeholder:text-[#aeaeb2] resize-none focus:outline-none focus:ring-1 transition-all disabled:opacity-50
                  ${justTooShort ? "ring-1 ring-red-400/60 focus:ring-red-400/60" : "focus:ring-[#fab758]/40 focus:bg-white"}`}
              />
              {justTooShort && (
                <p className="text-[11px] text-red-500">En az 10 karakter gerekli.</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Ayırıcı */}
      <div className="h-px bg-black/[0.05]" />

      {/* Genel Yorum */}
      <div className="space-y-1.5">
        <label className="text-[12px] font-medium text-[#6e6e73]">Genel Yorum <span className="font-normal text-[#aeaeb2]">(isteğe bağlı)</span></label>
        <textarea
          disabled={!canEvaluate}
          value={comment}
          onChange={(e) => { setComment(e.target.value); setSuccess(false) }}
          placeholder="Değerlendirme hakkında genel yorumunuz…"
          rows={3}
          className="w-full px-3 py-2 bg-[#f5f5f5] border-0 rounded-xl text-[12px] text-[#1c1c1c] placeholder:text-[#aeaeb2] resize-none focus:outline-none focus:ring-1 focus:ring-[#fab758]/40 focus:bg-white transition-all disabled:opacity-50"
        />
      </div>

      {/* Hata / Başarı */}
      {error && (
        <div className="bg-red-50 rounded-xl px-4 py-2.5">
          <p className="text-[13px] text-red-600">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 rounded-xl px-4 py-2.5">
          <p className="text-[13px] text-emerald-700">Değerlendirme kaydedildi.</p>
        </div>
      )}

      {/* Gönder */}
      {canEvaluate && (
        <div className="space-y-2">
          {!allFilled && (
            <p className="text-[11px] text-[#aeaeb2] text-center">
              Tüm kriterleri puanlayın ve gerekçe yazın.
            </p>
          )}
          <button
            onClick={submit}
            disabled={!allFilled || submitting}
            className="w-full py-2.5 bg-[#212121] text-white text-[13px] font-semibold rounded-xl hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            {submitting ? "Kaydediliyor…" : existingEvaluation ? "Değerlendirmeyi Güncelle" : "Değerlendirmeyi Gönder"}
          </button>
        </div>
      )}
    </div>
  )
}

function ScoreBand({
  score,
  filled,
  total,
}: {
  score: number
  filled: number
  total: number
}) {
  const band = getBand(score)
  const pct = Math.round((score / 5) * 100)

  return (
    <div className={`${band.bgColor} rounded-2xl px-4 py-3 space-y-2`}>
      <div className="flex items-center justify-between">
        <span className={`text-[13px] font-semibold ${band.textColor}`}>{band.label}</span>
        <span className="text-[12px] text-[#6e6e73] tabular-nums">
          {score.toFixed(2)} / 5 · {filled}/{total} kriter
        </span>
      </div>
      <div className="h-1.5 bg-black/[0.08] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${band.barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

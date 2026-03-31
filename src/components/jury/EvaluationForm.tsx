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
  { max: 2.0, label: "Desteklenemez", color: "bg-red-500", textColor: "text-red-700" },
  { max: 3.0, label: "Sınırlı Destek", color: "bg-orange-400", textColor: "text-orange-700" },
  { max: 4.0, label: "Genişletilmiş Destek", color: "bg-yellow-400", textColor: "text-yellow-700" },
  { max: 5.1, label: "Öncelikli Destek", color: "bg-green-500", textColor: "text-green-700" },
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Değerlendirme Cetveli</h2>
        {existingEvaluation && (
          <span className="text-xs text-muted-foreground">
            {canEvaluate ? "Düzenleniyor" : "Salt Okunur"}
          </span>
        )}
      </div>

      {/* Anlık Ortalama */}
      {avgScore !== null && (
        <ScoreBand score={avgScore} filled={filledScores.length} total={CRITERIA.length} />
      )}

      {/* Kriterler */}
      <div className="space-y-5">
        {CRITERIA.map((c) => {
          const entry = scores[c.key]
          const hasScore = entry.score > 0
          const hasJustification = entry.justification.trim().length >= 10
          return (
            <div key={c.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">{c.label}</label>
                {hasScore && (
                  <span className="text-xs text-muted-foreground">{entry.score}/5</span>
                )}
              </div>

              {/* Puan Seçimi */}
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    disabled={!canEvaluate}
                    onClick={() => updateScore(c.key, "score", n)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium border transition-colors
                      ${entry.score === n
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                      }
                      disabled:cursor-default disabled:opacity-70`}
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
                className={`w-full text-sm border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-50 disabled:text-muted-foreground
                  ${!hasJustification && entry.justification.length > 0 ? "border-red-300" : "border-slate-200"}`}
              />
              {!hasJustification && entry.justification.length > 0 && (
                <p className="text-xs text-red-500">En az 10 karakter gerekli.</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Genel Yorum */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Genel Yorum (isteğe bağlı)</label>
        <textarea
          disabled={!canEvaluate}
          value={comment}
          onChange={(e) => { setComment(e.target.value); setSuccess(false) }}
          placeholder="Değerlendirme hakkında genel yorumunuz…"
          rows={3}
          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-50 disabled:text-muted-foreground"
        />
      </div>

      {/* Hata / Başarı */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          Değerlendirme kaydedildi.
        </p>
      )}

      {/* Gönder */}
      {canEvaluate && (
        <button
          onClick={submit}
          disabled={!allFilled || submitting}
          className="w-full py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? "Kaydediliyor…" : existingEvaluation ? "Değerlendirmeyi Güncelle" : "Değerlendirmeyi Gönder"}
        </button>
      )}

      {!allFilled && canEvaluate && (
        <p className="text-xs text-muted-foreground text-center">
          Tüm kriterleri puanlayın ve gerekçe yazın.
        </p>
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
    <div className="bg-slate-50 border rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className={`text-sm font-semibold ${band.textColor}`}>{band.label}</span>
        <span className="text-sm text-muted-foreground">
          {score.toFixed(2)} / 5 ({filled}/{total} kriter)
        </span>
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${band.color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

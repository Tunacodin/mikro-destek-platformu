"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import type { ApplicationStatus } from "@prisma/client"
import { RotateCcw, CheckCircle, XCircle, ChevronRight, Calendar, AlertTriangle } from "lucide-react"

const SCOPE_OPTIONS = [
  {
    value: "LIMITED",
    label: "Sınırlı Destek",
    description: "Temel kaynak desteği",
    color: "border-amber-300 bg-amber-50",
    activeColor: "border-amber-500 bg-amber-100 ring-2 ring-amber-300",
    badge: "bg-amber-100 text-amber-700",
  },
  {
    value: "EXTENDED",
    label: "Genişletilmiş Destek",
    description: "Kapsamlı kaynak ve mentorluk",
    color: "border-blue-300 bg-blue-50",
    activeColor: "border-blue-500 bg-blue-100 ring-2 ring-blue-300",
    badge: "bg-blue-100 text-blue-700",
  },
  {
    value: "PRIORITY",
    label: "Öncelikli Destek",
    description: "Tam destek paketi + ekosistem entegrasyonu",
    color: "border-emerald-300 bg-emerald-50",
    activeColor: "border-emerald-500 bg-emerald-100 ring-2 ring-emerald-300",
    badge: "bg-emerald-100 text-emerald-700",
  },
]

const inputCls = "w-full px-3 py-2 bg-[#f5f5f5] border border-transparent rounded-xl text-[13px] text-[#1c1c1c] focus:outline-none focus:ring-2 focus:ring-[#fab758]/50 focus:bg-white focus:border-[#fab758]/30 transition-all"

export function ApplicationDecisionButtons({
  applicationId,
  status,
}: {
  applicationId: string
  status: ApplicationStatus
}) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const pendingRef = useRef(false)
  const [selectedScope, setSelectedScope] = useState<string>("")
  const [notes, setNotes] = useState("")
  const [presentationDate, setPresentationDate] = useState("")
  const [showRevizeConfirm, setShowRevizeConfirm] = useState(false)
  const [showRejectConfirm, setShowRejectConfirm] = useState(false)

  async function changeStatus(newStatus: string, extra?: Record<string, string | undefined>) {
    if (pendingRef.current) return
    pendingRef.current = true
    setLoading(newStatus)
    try {
      await fetch(`/api/admin/applications/${applicationId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, ...extra }),
      })
      router.refresh()
    } finally {
      pendingRef.current = false
      setLoading(null)
    }
  }

  // ── SUBMITTED → Ön Değerlendirme (Aşama 3) ──────────────────────────────
  if (status === "SUBMITTED") {
    return (
      <div className="bg-white rounded-2xl border border-blue-100 p-5 space-y-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Aşama 3</span>
          </div>
          <p className="text-[13px] font-semibold text-[#1c1c1c]">Ön Değerlendirme</p>
          <p className="text-[12px] text-[#6e6e73] mt-0.5">
            İncelemeye alın, revizeye gönderin veya reddedin.
          </p>
        </div>

        {/* İncelemeye Al — presentationDate ile */}
        <div className="space-y-2.5 p-3.5 bg-[#f9f9f9] rounded-xl border border-black/[0.05]">
          <p className="text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3 h-3" /> Jüri Sunum Tarihi
            <span className="font-normal text-[#aeaeb2]">(isteğe bağlı)</span>
          </p>
          <input
            type="datetime-local"
            value={presentationDate}
            onChange={(e) => setPresentationDate(e.target.value)}
            className={inputCls}
          />
          <button
            onClick={() => changeStatus("IN_REVIEW", {
              presentationDate: presentationDate
                ? new Date(presentationDate).toISOString()
                : undefined,
            })}
            disabled={!!loading}
            className="w-full flex items-center justify-between px-4 py-3 bg-[#212121] text-white text-[13px] font-semibold rounded-xl shadow-sm hover:bg-[#383838] hover:shadow disabled:opacity-50 transition-colors cursor-pointer"
          >
            <span>İncelemeye Al</span>
            {loading === "IN_REVIEW"
              ? <span className="text-[11px] opacity-60">İşleniyor…</span>
              : <ChevronRight className="w-4 h-4 opacity-60" />}
          </button>
        </div>

        <div className="h-px bg-black/[0.04]" />

        {/* Revizeye Gönder */}
        {!showRevizeConfirm && !showRejectConfirm && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowRevizeConfirm(true)}
              disabled={!!loading}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 border border-amber-400 text-amber-700 text-[12px] font-medium rounded-xl hover:bg-amber-100 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Revizeye Gönder
            </button>
            <button
              onClick={() => setShowRejectConfirm(true)}
              disabled={!!loading}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 border border-red-300 text-red-600 text-[12px] font-medium rounded-xl hover:bg-red-100 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" /> Reddet
            </button>
          </div>
        )}

        {showRevizeConfirm && (
          <div className="space-y-2.5 p-3.5 bg-amber-50 rounded-xl border border-amber-200">
            <p className="text-[11px] font-semibold text-amber-800 flex items-center gap-1.5">
              <RotateCcw className="w-3 h-3" /> Revize Notu
              <span className="font-normal">(isteğe bağlı)</span>
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Hangi bilgilerin güncellenmesi gerekiyor?"
              rows={3}
              className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-[12px] text-[#1c1c1c] placeholder:text-[#c7c7cc] resize-none focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
            <div className="flex gap-2">
              <button onClick={() => { setShowRevizeConfirm(false); setNotes("") }}
                className="flex-1 py-2 text-[12px] text-[#6e6e73] rounded-lg hover:bg-amber-100 transition-colors cursor-pointer">
                İptal
              </button>
              <button onClick={() => changeStatus("DRAFT", { notes: notes || undefined })}
                disabled={!!loading}
                className="flex-1 py-2 bg-amber-500 text-white text-[12px] font-semibold rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors cursor-pointer">
                {loading === "DRAFT" ? "Gönderiliyor…" : "Revizeye Gönder"}
              </button>
            </div>
          </div>
        )}

        {showRejectConfirm && (
          <div className="space-y-2.5 p-3.5 bg-red-50 rounded-xl border border-red-300">
            <p className="text-[11px] font-semibold text-red-700 flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3" /> Başvuruyu Reddet
            </p>
            <p className="text-[11px] text-red-600">
              Bu işlem geri alınamaz. Başvuru sahibi bilgilendirilecek.
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Red gerekçesi (isteğe bağlı)"
              rows={2}
              className="w-full px-3 py-2 bg-white border border-red-300 rounded-lg text-[12px] text-[#1c1c1c] placeholder:text-[#c7c7cc] resize-none focus:outline-none focus:ring-1 focus:ring-red-300"
            />
            <div className="flex gap-2">
              <button onClick={() => { setShowRejectConfirm(false); setNotes("") }}
                className="flex-1 py-2 text-[12px] text-[#6e6e73] rounded-lg hover:bg-red-100 transition-colors cursor-pointer">
                İptal
              </button>
              <button onClick={() => changeStatus("REJECTED", { notes: notes || undefined })}
                disabled={!!loading}
                className="flex-1 py-2 bg-red-600 text-white text-[12px] font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors cursor-pointer">
                {loading === "REJECTED" ? "İşleniyor…" : "Reddet"}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── IN_REVIEW → Jüri Değerlendirmesini Kapat (Aşama 5a → 5b) ────────────
  if (status === "IN_REVIEW") {
    return <CloseEvaluationPanel applicationId={applicationId} />
  }

  // ── EVALUATED → Destek Kararı (Aşama 5b) ────────────────────────────────
  if (status === "EVALUATED") {
    const canSupport = !!selectedScope

    return (
      <div className="bg-white rounded-2xl border border-purple-100 p-5 space-y-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Aşama 5b</span>
          </div>
          <p className="text-[13px] font-semibold text-[#1c1c1c]">Destek Kararı</p>
          <p className="text-[12px] text-[#6e6e73] mt-0.5">
            Değerlendirme tamamlandı. Destek kapsamı ve süresini belirleyin.
          </p>
        </div>

        {/* Scope */}
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-wider">Destek Kapsamı</p>
          <div className="space-y-2">
            {SCOPE_OPTIONS.map((opt) => (
              <button key={opt.value} onClick={() => setSelectedScope(opt.value)}
                className={`w-full text-left px-3.5 py-3 border rounded-xl transition-all cursor-pointer ${selectedScope === opt.value ? opt.activeColor : opt.color}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-[#1c1c1c]">{opt.label}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${opt.badge}`}>{opt.value}</span>
                </div>
                <p className="text-[11px] text-[#6e6e73] mt-0.5">{opt.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Karar Notu */}
        <div>
          <label className="block text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-wider mb-1.5">
            Karar Notu <span className="font-normal">(isteğe bağlı)</span>
          </label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Destek kapsamı hakkında notlar…" rows={2}
            className="w-full px-3 py-2 bg-[#f9f9f9] border border-black/[0.08] rounded-xl text-[12px] text-[#1c1c1c] placeholder:text-[#c7c7cc] resize-none focus:outline-none focus:ring-1 focus:ring-[#fab758]/40" />
        </div>

        {/* Aksiyon */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => changeStatus("SUPPORTED", {
              scope: selectedScope,
              notes: notes || undefined,
            })}
            disabled={!canSupport || !!loading}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 text-white text-[13px] font-semibold rounded-xl shadow-sm hover:bg-emerald-700 hover:shadow disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            {loading === "SUPPORTED" ? "…" : "Destekle"}
          </button>
          <button
            onClick={() => changeStatus("REJECTED")}
            disabled={!!loading}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-600 text-white text-[13px] font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <XCircle className="w-3.5 h-3.5" />
            {loading === "REJECTED" ? "…" : "Reddet"}
          </button>
        </div>
        {!canSupport && (
          <p className="text-[11px] text-[#aeaeb2] text-center">Desteklemek için önce destek kapsamı seçin.</p>
        )}
      </div>
    )
  }

  return null
}

// ── Jüri Değerlendirmesini Kapat → Sonuç Seç ────────────────────────────────

function CloseEvaluationPanel({ applicationId }: { applicationId: string }) {
  const router = useRouter()
  const pendingRef = useRef(false)
  const [step, setStep] = useState<"button" | "choice">("button")
  const [selectedScope, setSelectedScope] = useState("")
  const [notes, setNotes] = useState("")
  const [showRejectConfirm, setShowRejectConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  async function callStatus(status: string, extra?: Record<string, string | undefined>) {
    const res = await fetch(`/api/admin/applications/${applicationId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, ...extra }),
    })
    if (!res.ok) throw new Error(await res.text())
  }

  async function handleDecide(scope: string) {
    if (pendingRef.current) return
    pendingRef.current = true
    setLoading(true)
    try {
      await callStatus("EVALUATED")
      await callStatus("SUPPORTED", { scope, notes: notes || undefined })
      router.refresh()
    } finally {
      pendingRef.current = false
      setLoading(false)
    }
  }

  async function handleReject() {
    if (pendingRef.current) return
    pendingRef.current = true
    setLoading(true)
    try {
      await callStatus("EVALUATED")
      await callStatus("REJECTED", { notes: notes || undefined })
      router.refresh()
    } finally {
      pendingRef.current = false
      setLoading(false)
    }
  }

  // ── Adım 1: Karar Ver butonu ──────────────────────────────────────────────
  if (step === "button") {
    return (
      <div className="bg-white rounded-2xl border border-purple-100 p-5 space-y-3">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Aşama 5</span>
          </div>
          <p className="text-[13px] font-semibold text-[#1c1c1c]">Destek Kararı</p>
          <p className="text-[12px] text-[#6e6e73] mt-0.5">
            Süreci sonlandırıp destek kapsamını veya redi belirleyin.
          </p>
        </div>
        <button
          onClick={() => setStep("choice")}
          className="w-full flex items-center justify-between px-4 py-3 bg-purple-600 text-white text-[13px] font-semibold rounded-xl shadow-sm hover:bg-purple-700 hover:shadow transition-colors cursor-pointer"
        >
          <span>Karar Ver</span>
          <ChevronRight className="w-4 h-4 opacity-70" />
        </button>
      </div>
    )
  }

  // ── Adım 2: Sonuç seç ────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl border border-purple-100 p-5 space-y-4">
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Aşama 5b</span>
        </div>
        <p className="text-[13px] font-semibold text-[#1c1c1c]">Sonuç Kararı</p>
        <p className="text-[12px] text-[#6e6e73] mt-0.5">Destek kapsamını seçin ve onaylayın.</p>
      </div>

      {/* 3 kapsam seçeneği */}
      {!showRejectConfirm && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-wider">Destek Kapsamı</p>
          <div className="space-y-2">
            {SCOPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelectedScope(opt.value)}
                className={`w-full text-left px-3.5 py-3 border rounded-xl transition-all cursor-pointer ${
                  selectedScope === opt.value ? opt.activeColor : opt.color
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-[#1c1c1c]">{opt.label}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${opt.badge}`}>{opt.value}</span>
                </div>
                <p className="text-[11px] text-[#6e6e73] mt-0.5">{opt.description}</p>
              </button>
            ))}
          </div>

          {/* Karar notu */}
          <div className="pt-1">
            <label className="block text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-wider mb-1.5">
              Karar Notu <span className="font-normal">(isteğe bağlı)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Destek kapsamı hakkında notlar…"
              rows={2}
              className="w-full px-3 py-2 bg-[#f9f9f9] border border-black/[0.08] rounded-xl text-[12px] text-[#1c1c1c] placeholder:text-[#c7c7cc] resize-none focus:outline-none focus:ring-1 focus:ring-[#fab758]/40"
            />
          </div>

          {/* Aksiyonlar */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setStep("button")}
              disabled={loading}
              className="px-3 py-2.5 text-[12px] text-[#6e6e73] rounded-xl hover:bg-[#f5f5f5] disabled:opacity-40 transition-colors cursor-pointer"
            >
              Geri
            </button>
            <button
              onClick={() => handleDecide(selectedScope)}
              disabled={!selectedScope || loading}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 text-white text-[13px] font-semibold rounded-xl shadow-sm hover:bg-emerald-700 hover:shadow disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              {loading ? "İşleniyor…" : "Onayla ve Destekle"}
            </button>
            <button
              onClick={() => { setShowRejectConfirm(true); setNotes("") }}
              disabled={loading}
              className="px-3 py-2.5 border border-red-300 text-red-600 text-[12px] font-medium rounded-xl hover:bg-red-50 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
          {!selectedScope && (
            <p className="text-[11px] text-[#aeaeb2] text-center">Desteklemek için önce destek kapsamı seçin.</p>
          )}
        </div>
      )}

      {/* Red onay */}
      {showRejectConfirm && (
        <div className="space-y-2.5 p-3.5 bg-red-50 rounded-xl border border-red-300">
          <p className="text-[11px] font-semibold text-red-700 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3" /> Başvuruyu Reddet
          </p>
          <p className="text-[11px] text-red-600">Bu işlem geri alınamaz. Başvuru sahibi bilgilendirilecek.</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Red gerekçesi (isteğe bağlı)"
            rows={2}
            className="w-full px-3 py-2 bg-white border border-red-300 rounded-lg text-[12px] text-[#1c1c1c] placeholder:text-[#c7c7cc] resize-none focus:outline-none focus:ring-1 focus:ring-red-300"
          />
          <div className="flex gap-2">
            <button
              onClick={() => { setShowRejectConfirm(false); setNotes("") }}
              className="flex-1 py-2 text-[12px] text-[#6e6e73] rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
            >
              İptal
            </button>
            <button
              onClick={handleReject}
              disabled={loading}
              className="flex-1 py-2 bg-red-600 text-white text-[12px] font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {loading ? "İşleniyor…" : "Reddet"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

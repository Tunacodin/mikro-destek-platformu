"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Calendar, CheckCircle, XCircle, ChevronRight } from "lucide-react"

const inputCls = "w-full px-3 py-2 bg-[#f5f5f5] border border-transparent rounded-xl text-[13px] text-[#1c1c1c] focus:outline-none focus:ring-2 focus:ring-[#fab758]/50 focus:bg-white focus:border-[#fab758]/30 transition-all"

export function ProjectStatusPanel({
  projectId,
  currentStatus,
  currentSupportEndDate,
}: {
  projectId: string
  currentStatus: string
  currentSupportEndDate: string | null
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const pendingRef = useRef(false)
  const [supportEndDate, setSupportEndDate] = useState(
    currentSupportEndDate
      ? new Date(currentSupportEndDate).toISOString().slice(0, 16)
      : ""
  )
  const [showClose, setShowClose] = useState(false)

  async function updateEndDate() {
    if (pendingRef.current) return
    pendingRef.current = true
    setLoading(true)
    try {
      await fetch(`/api/admin/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supportEndDate: supportEndDate ? new Date(supportEndDate).toISOString() : null }),
      })
      router.refresh()
    } finally {
      pendingRef.current = false
      setLoading(false)
    }
  }

  async function closeProject() {
    if (pendingRef.current) return
    pendingRef.current = true
    setLoading(true)
    try {
      await fetch(`/api/admin/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CLOSED" }),
      })
      setShowClose(false)
      router.refresh()
    } finally {
      pendingRef.current = false
      setLoading(false)
    }
  }

  async function reopenProject() {
    if (pendingRef.current) return
    pendingRef.current = true
    setLoading(true)
    try {
      await fetch(`/api/admin/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" }),
      })
      router.refresh()
    } finally {
      pendingRef.current = false
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] p-4 space-y-4">
      <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-[0.12em]">
        Proje Yönetimi
      </p>

      {/* Destek süresi güncelle */}
      <div className="space-y-2">
        <label className="text-[11px] font-semibold text-[#6e6e73] flex items-center gap-1.5">
          <Calendar className="w-3 h-3" /> Destek Süresi Bitişi
        </label>
        <input
          type="datetime-local"
          value={supportEndDate}
          onChange={(e) => setSupportEndDate(e.target.value)}
          className={inputCls}
        />
        <button
          onClick={updateEndDate}
          disabled={loading}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-[#212121] text-white text-[13px] font-semibold rounded-xl shadow-sm hover:bg-[#383838] hover:shadow disabled:opacity-50 transition-colors cursor-pointer"
        >
          <span>Tarihi Kaydet</span>
          {loading ? (
            <span className="text-[11px] opacity-60">İşleniyor…</span>
          ) : (
            <ChevronRight className="w-4 h-4 opacity-60" />
          )}
        </button>
      </div>

      <div className="h-px bg-black/[0.05]" />

      {/* Proje durumu */}
      {currentStatus === "ACTIVE" ? (
        !showClose ? (
          <button
            onClick={() => setShowClose(true)}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 text-[#6e6e73] text-[13px] font-medium rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <XCircle className="w-3.5 h-3.5" /> Projeyi Kapat
          </button>
        ) : (
          <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-[11px] text-[#6e6e73]">
              Proje kapatılacak. Üye yeni güncelleme notu/dosya gönderemez.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowClose(false)}
                className="flex-1 py-2 text-[12px] text-[#6e6e73] rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                İptal
              </button>
              <button
                onClick={closeProject}
                disabled={loading}
                className="flex-1 py-2 bg-slate-700 text-white text-[12px] font-semibold rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {loading ? "…" : "Kapat"}
              </button>
            </div>
          </div>
        )
      ) : (
        <button
          onClick={reopenProject}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-emerald-200 text-emerald-700 text-[13px] font-medium rounded-xl hover:bg-emerald-50 disabled:opacity-50 transition-colors cursor-pointer"
        >
          <CheckCircle className="w-3.5 h-3.5" /> Projeyi Yeniden Aç
        </button>
      )}
    </div>
  )
}

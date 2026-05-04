"use client"

import { useEffect, useState } from "react"
import { Calendar, FilePlus } from "lucide-react"
import Link from "next/link"

function fmtFull(d: Date) {
  return d.toLocaleString("tr-TR", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function getParts(target: Date) {
  const diff = target.getTime() - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, totalDays: 0 }
  const totalSeconds = Math.floor(diff / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  return { days, hours, minutes, totalDays: diff / 86_400_000 }
}

export function PeriodHeroCountdown({
  endDate,
  startDate,
  title,
}: {
  endDate: string
  startDate: string
  title: string
}) {
  const target = new Date(endDate)
  const start = new Date(startDate)
  const [parts, setParts] = useState(() => getParts(target))

  useEffect(() => {
    const id = setInterval(() => setParts(getParts(target)), 60_000)
    return () => clearInterval(id)
  }, [endDate]) // eslint-disable-line react-hooks/exhaustive-deps

  const urgent = parts.totalDays <= 7 && parts.totalDays > 0
  const totalDays = Math.ceil((target.getTime() - start.getTime()) / 86_400_000)
  const elapsed = totalDays - parts.days
  const pct = Math.min(100, Math.max(0, (elapsed / totalDays) * 100))

  return (
    <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Geri sayım hero */}
      <div className={`px-5 py-5 text-center ${urgent ? "bg-gradient-to-b from-amber-50 to-white" : "bg-gradient-to-b from-[#f0f0f0] to-white"}`}>
        <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-wider mb-2">Başvuru Bitişine</p>
        <p className={`text-[48px] font-black leading-none tabular-nums tracking-tight ${urgent ? "text-amber-500" : "text-[#1c1c1c]"}`}>
          {parts.days}
        </p>
        <p className={`text-[13px] font-medium mt-1 ${urgent ? "text-amber-600" : "text-[#6e6e73]"}`}>
          gün kaldı
        </p>
        <p className={`text-[12px] font-semibold tabular-nums mt-1.5 ${urgent ? "text-amber-600" : "text-[#1c1c1c]"}`}>
          {parts.hours} saat {parts.minutes} dakika
        </p>
        {urgent && (
          <p className="text-[11px] text-amber-500 mt-1.5 font-medium">Son hafta — başvurunuzu tamamlayın!</p>
        )}
      </div>

      {/* Dönem bilgisi */}
      <div className="px-5 pb-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[14px] font-semibold text-[#1c1c1c]">{title}</p>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">Açık</span>
        </div>
        <div className="flex items-center gap-1.5 text-[12px] text-[#6e6e73]">
          <Calendar className="w-3 h-3 text-[#aeaeb2]" />
          Bitiş: {fmtFull(target)}
        </div>

        <div className="space-y-1">
          <div className="h-2 bg-[#f0f0f0] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${urgent ? "bg-amber-400" : "bg-[#1c1c1c]"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-[#aeaeb2]">
            <span>%{Math.round(pct)} tamamlandı</span>
            <span>{parts.days} gün kaldı</span>
          </div>
        </div>

        <Link href="/dashboard/apply"
          className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#1c1c1c] text-white text-[13px] font-semibold rounded-xl hover:bg-[#383838] transition-colors cursor-pointer">
          <FilePlus className="w-3.5 h-3.5" /> Bu Döneme Başvur
        </Link>
      </div>
    </div>
  )
}

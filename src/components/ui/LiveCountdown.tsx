"use client"

import { useEffect, useState } from "react"

function getTimeLeft(target: Date) {
  const diff = target.getTime() - Date.now()
  if (diff <= 0) return null
  const days = Math.floor(diff / 86_400_000)
  const hours = Math.floor((diff % 86_400_000) / 3_600_000)
  const minutes = Math.floor((diff % 3_600_000) / 60_000)
  const seconds = Math.floor((diff % 60_000) / 1000)
  return { days, hours, minutes, seconds, totalHours: diff / 3_600_000 }
}

function pad(n: number) { return String(n).padStart(2, "0") }

export function LiveCountdown({
  targetDate,
  label,
  size = "default",
}: {
  targetDate: string
  label: string
  size?: "compact" | "default"
}) {
  const [t, setT] = useState(() => getTimeLeft(new Date(targetDate)))

  useEffect(() => {
    const id = setInterval(() => setT(getTimeLeft(new Date(targetDate))), 1000)
    return () => clearInterval(id)
  }, [targetDate])

  if (!t) return null

  const urgent = t.totalHours < 72

  if (size === "compact") {
    return (
      <div className="flex items-center gap-2">
        <span className={`text-[10px] font-semibold uppercase tracking-wider ${urgent ? "text-red-500" : "text-[#aeaeb2]"}`}>
          {label}
        </span>
        <span className={`text-[13px] font-bold tabular-nums ${urgent ? "text-red-600" : "text-[#1c1c1c]"}`}>
          {t.days > 0 && `${t.days}g `}{pad(t.hours)}:{pad(t.minutes)}:{pad(t.seconds)}
        </span>
      </div>
    )
  }

  return (
    <div className={`rounded-xl border overflow-hidden ${urgent ? "border-red-100" : "border-[#e8e8e8]"}`}>
      <div className={`px-4 py-1.5 text-center ${urgent ? "bg-red-50" : "bg-[#f5f5f5]"}`}>
        <p className={`text-[10px] font-semibold uppercase tracking-wider ${urgent ? "text-red-500" : "text-[#aeaeb2]"}`}>
          {label}
        </p>
      </div>
      <div className="flex items-center justify-center gap-1 px-4 py-3 bg-white">
        {t.days > 0 && (
          <>
            <Unit value={t.days} label="GÜN" urgent={urgent} />
            <Colon urgent={urgent} />
          </>
        )}
        <Unit value={t.hours} label="SA" urgent={urgent} />
        <Colon urgent={urgent} />
        <Unit value={t.minutes} label="DK" urgent={urgent} />
        <Colon urgent={urgent} />
        <Unit value={t.seconds} label="SN" urgent={urgent} />
      </div>
    </div>
  )
}

function Unit({ value, label, urgent }: { value: number; label: string; urgent: boolean }) {
  return (
    <div className="text-center min-w-[32px]">
      <p className={`text-[20px] font-bold tabular-nums leading-none ${urgent ? "text-red-600" : "text-[#1c1c1c]"}`}>
        {pad(value)}
      </p>
      <p className={`text-[8px] font-semibold uppercase tracking-widest mt-1 ${urgent ? "text-red-400" : "text-[#aeaeb2]"}`}>
        {label}
      </p>
    </div>
  )
}

function Colon({ urgent }: { urgent: boolean }) {
  return (
    <span className={`text-[14px] font-light pb-3 leading-none select-none ${urgent ? "text-red-300" : "text-[#d1d1d6]"}`}>:</span>
  )
}

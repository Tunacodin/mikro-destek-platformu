"use client"

import { useEffect, useState } from "react"
import { Clock } from "lucide-react"

function getTimeLeft(target: Date) {
  const diff = target.getTime() - Date.now()
  if (diff <= 0) return null
  const totalSeconds = Math.floor(diff / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  return { days, hours, minutes, totalHours: diff / 3_600_000 }
}

export function InlineCountdown({ targetDate, label }: { targetDate: Date; label: string }) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(targetDate))

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft(targetDate)), 60_000)
    return () => clearInterval(id)
  }, [targetDate])

  if (!timeLeft) return null

  const urgent = timeLeft.totalHours < 48

  return (
    <div className={`rounded-xl px-4 py-3 border ${
      urgent ? "bg-red-50 border-red-100" : "bg-[#f5f5f5] border-[#e8e8e8]"
    }`}>
      <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${
        urgent ? "text-red-500" : "text-[#aeaeb2]"
      }`}>
        {label}
      </p>
      <div className="flex items-center gap-1.5">
        <Clock className={`w-3.5 h-3.5 ${urgent ? "text-red-400" : "text-[#aeaeb2]"}`} />
        <span className={`text-[16px] font-bold tabular-nums ${urgent ? "text-red-600" : "text-[#1c1c1c]"}`}>
          {timeLeft.days > 0 && `${timeLeft.days}g `}{timeLeft.hours}sa {timeLeft.minutes}dk
        </span>
      </div>
    </div>
  )
}

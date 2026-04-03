"use client"

import { useEffect, useState } from "react"

function getTimeLeft(target: Date) {
  const diff = target.getTime() - Date.now()
  if (diff <= 0) return null
  const totalSeconds = Math.floor(diff / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return { days, hours, minutes, seconds, totalHours: diff / 3_600_000 }
}

function pad(n: number) {
  return String(n).padStart(2, "0")
}

export function CountdownTimer({ targetDate, label }: { targetDate: Date; label: string }) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(targetDate))

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft(targetDate)), 1000)
    return () => clearInterval(id)
  }, [targetDate])

  if (!timeLeft) return null

  const isUrgent = timeLeft.totalHours < 48

  return (
    <div className={`bg-white rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] ${isUrgent ? "ring-1 ring-red-200" : ""}`}>
      <p className={`text-[11px] font-semibold uppercase tracking-[0.1em] mb-3.5 ${isUrgent ? "text-red-500" : "text-[#6e6e73]"}`}>
        {label}
      </p>
      <div className="flex items-end gap-2">
        <Seg value={timeLeft.days} unit="GÜN" urgent={isUrgent} />
        <Colon urgent={isUrgent} />
        <Seg value={timeLeft.hours} unit="SA" urgent={isUrgent} />
        <Colon urgent={isUrgent} />
        <Seg value={timeLeft.minutes} unit="DK" urgent={isUrgent} />
        <Colon urgent={isUrgent} />
        <Seg value={timeLeft.seconds} unit="SN" urgent={isUrgent} />
      </div>
    </div>
  )
}

function Seg({ value, unit, urgent }: { value: number; unit: string; urgent: boolean }) {
  return (
    <div className="text-center min-w-[34px]">
      <div className={`text-[22px] font-bold tabular-nums leading-none tracking-tight ${urgent ? "text-red-600" : "text-[#1c1c1c]"}`}>
        {pad(value)}
      </div>
      <div className={`text-[9px] font-semibold uppercase tracking-widest mt-1.5 ${urgent ? "text-red-400" : "text-[#aeaeb2]"}`}>
        {unit}
      </div>
    </div>
  )
}

function Colon({ urgent }: { urgent: boolean }) {
  return (
    <span className={`text-base font-light pb-5 leading-none select-none ${urgent ? "text-red-300" : "text-[#d2d2d7]"}`}>:</span>
  )
}

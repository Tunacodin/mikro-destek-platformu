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
    <div className={`bg-white rounded-2xl p-5 border shadow-[0_1px_6px_rgba(0,0,0,0.04)] ${
      isUrgent
        ? "border-red-200 shadow-[0_0_0_3px_rgba(220,38,38,0.06),0_1px_6px_rgba(0,0,0,0.04)]"
        : "border-black/[0.06]"
    }`}>
      <p className={`text-[10px] font-semibold uppercase tracking-[0.12em] mb-4 ${
        isUrgent ? "text-red-500" : "text-[#aeaeb2]"
      }`}>
        {label}
      </p>
      <div className="flex items-end gap-1">
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
    <div className="text-center min-w-[36px]">
      <div className={`text-[24px] font-bold tabular-nums leading-none tracking-tight ${
        urgent ? "text-red-600" : "text-[#1c1c1c]"
      }`}>
        {pad(value)}
      </div>
      <div className={`text-[9px] font-semibold uppercase tracking-widest mt-1.5 ${
        urgent ? "text-red-400" : "text-[#aeaeb2]"
      }`}>
        {unit}
      </div>
    </div>
  )
}

function Colon({ urgent }: { urgent: boolean }) {
  return (
    <span className={`text-[16px] font-light pb-5 leading-none select-none ${
      urgent ? "text-red-300" : "text-[#d2d2d7]"
    }`}>:</span>
  )
}

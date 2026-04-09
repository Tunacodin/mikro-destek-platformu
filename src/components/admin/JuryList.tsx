import { CheckCircle2, Clock } from "lucide-react"

type Member = {
  id: string
  email: string
  name: string | null
  onboardingCompleted: boolean
  createdAt: Date
  _count: { juryAssignments: number }
}

export function JuryList({ members }: { members: Member[] }) {
  if (members.length === 0) {
    return (
      <p className="text-[13px] text-[#aeaeb2] py-6 text-center">
        Henüz jüri üyesi yok. Yukarıdaki formu kullanarak davet gönderin.
      </p>
    )
  }

  return (
    <div className="divide-y divide-black/[0.04]">
      {members.map((m) => (
        <div key={m.id} className="py-3.5 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-[#1c1c1c] truncate">{m.name ?? m.email}</p>
            {m.name && (
              <p className="text-[12px] text-[#6e6e73] truncate">{m.email}</p>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[12px] text-[#aeaeb2]">
              {m._count.juryAssignments} atama
            </span>

            {m.onboardingCompleted ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 rounded-full px-2.5 py-1">
                <CheckCircle2 className="w-3 h-3" />
                Aktif
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 rounded-full px-2.5 py-1">
                <Clock className="w-3 h-3" />
                Bekleniyor
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

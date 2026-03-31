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
      <p className="text-sm text-muted-foreground py-4 text-center">
        Henüz jüri üyesi yok. Yukarıdaki formu kullanarak davet gönderin.
      </p>
    )
  }

  return (
    <div className="divide-y">
      {members.map((m) => (
        <div key={m.id} className="py-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{m.name ?? m.email}</p>
            {m.name && (
              <p className="text-xs text-muted-foreground truncate">{m.email}</p>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-muted-foreground">
              {m._count.juryAssignments} atama
            </span>

            {m.onboardingCompleted ? (
              <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                <CheckCircle2 className="w-3 h-3" />
                Aktif
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
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

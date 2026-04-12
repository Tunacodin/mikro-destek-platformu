import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { CreateProgramForm } from "@/components/admin/CreateProgramForm"
import { ProgramList } from "@/components/admin/ProgramList"

export const metadata = { title: "Program Yönetimi — Mikro Destek Fonu" }

export default async function AdminProgramsPage() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") redirect("/login")

  const now = new Date()

  const programs = await prisma.program.findMany({
    orderBy: { createdAt: "desc" },
  })

  const active = programs.filter((p) => p.status === "ACTIVE")
  const draft  = programs.filter((p) => p.status === "DRAFT")
  const closed = programs.filter((p) => p.status === "CLOSED")

  const activeProgram = active[0] ?? null
  const daysLeft = activeProgram
    ? Math.max(0, Math.ceil((new Date(activeProgram.endDate).getTime() - now.getTime()) / 86_400_000))
    : null

  const fmt = (d: Date) =>
    new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })

  const grouped = [
    { label: "Aktif",  count: active.length,  items: active,  dot: "bg-emerald-500" },
    { label: "Taslak", count: draft.length,   items: draft,   dot: "bg-slate-400"   },
    { label: "Kapalı", count: closed.length,  items: closed,  dot: "bg-red-400"     },
  ].filter((g) => g.items.length > 0)

  return (
    <div className="space-y-8">

      {/* Başlık + Aktif Program */}
      <div className="pb-6 border-b border-[#e8e8e8] flex items-center justify-between gap-6 flex-wrap">
        <div>
          <h1 className="text-[26px] font-bold text-[#1c1c1c] tracking-tight">Program Yönetimi</h1>
          <p className="text-[14px] text-[#b0b0b0] mt-1">
            {programs.length} program · {active.length} aktif
          </p>
        </div>

        {activeProgram ? (
          <div className="flex items-center gap-5">
            <div className="text-right">
              <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-wider">Aktif Program</p>
              <p className="text-[15px] font-semibold text-[#1c1c1c] mt-0.5">{activeProgram.title}</p>
              <p className="text-[12px] text-[#6e6e73]">
                {fmt(activeProgram.startDate)} — {fmt(activeProgram.endDate)}
              </p>
            </div>
            <div className="flex items-center gap-4 pl-5 border-l border-black/[0.08]">
              <div className="text-center">
                <p className="text-[28px] font-bold text-[#fab758] leading-none tabular-nums">{daysLeft}</p>
                <p className="text-[10px] text-[#6e6e73] mt-0.5">gün kaldı</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-right">
            <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-wider">Aktif Program</p>
            <p className="text-[13px] text-[#6e6e73] mt-0.5">Şu an aktif program yok</p>
          </div>
        )}
      </div>

      {/* 2 Kolon */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6 items-start">

        {/* Sol: Yeni Program Formu */}
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] p-5">
          <h2 className="text-[13px] font-semibold text-[#1c1c1c] mb-4">Yeni Program Oluştur</h2>
          <CreateProgramForm />
        </div>

        {/* Sağ: Program Listesi */}
        <div>
          {programs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] p-12 text-center">
              <p className="text-[15px] font-semibold text-[#1c1c1c]">Henüz program yok</p>
              <p className="text-[13px] text-[#6e6e73] mt-1.5">
                Sol taraftaki formu kullanarak ilk programı oluşturun.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {grouped.map((g) => (
                <div key={g.label}>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${g.dot}`} />
                    <p className="text-[11px] font-semibold text-[#aeaeb2] uppercase tracking-[0.12em]">
                      {g.label} <span className="font-normal ml-1">{g.count}</span>
                    </p>
                  </div>
                  <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] overflow-hidden">
                    <ProgramList programs={g.items} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

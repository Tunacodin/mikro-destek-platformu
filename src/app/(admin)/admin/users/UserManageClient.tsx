"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Trash2, UserPlus, ChevronRight, X, RefreshCw } from "lucide-react"

type User = {
  id: string
  name: string | null
  email: string
  role: "ADMIN" | "APPLICANT" | "JURY"
  createdAt: string
  _count: { applications: number; juryAssignments: number }
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN:     "Admin",
  APPLICANT: "Üye",
  JURY:      "Jüri",
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN:     "bg-[#fab758]/10 text-[#c47d0a]",
  APPLICANT: "bg-emerald-50 text-emerald-700",
  JURY:      "bg-blue-50 text-blue-700",
}

const inputCls = "w-full px-3 py-2 bg-[#f5f5f5] border border-transparent rounded-xl text-[13px] text-[#1c1c1c] focus:outline-none focus:ring-2 focus:ring-[#fab758]/50 focus:bg-white focus:border-[#fab758]/30 transition-all"

type Tab = "APPLICANT" | "JURY" | "ADMIN"

export function UserManageClient({
  users,
  currentUserId,
}: {
  users: User[]
  currentUserId: string
}) {
  const router = useRouter()
  const pendingRef = useRef(false)
  const [activeTab, setActiveTab] = useState<Tab>("APPLICANT")
  const [showAdd, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState("")
  const [changeRoleUser, setChangeRoleUser] = useState<User | null>(null)

  const [form, setForm] = useState({ name: "", email: "", password: "", role: "APPLICANT" as Tab })
  const [error, setError] = useState("")

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "APPLICANT", label: "Üyeler",  count: users.filter(u => u.role === "APPLICANT").length },
    { id: "JURY",      label: "Jüri",    count: users.filter(u => u.role === "JURY").length },
    { id: "ADMIN",     label: "Adminler", count: users.filter(u => u.role === "ADMIN").length },
  ]

  const filtered = users.filter(u => u.role === activeTab)

  async function handleAdd() {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError("Tüm alanları doldurun.")
      return
    }
    if (pendingRef.current) return
    pendingRef.current = true
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Bir hata oluştu.")
        return
      }
      setShowAdd(false)
      setForm({ name: "", email: "", password: "", role: "APPLICANT" })
      router.refresh()
    } finally {
      pendingRef.current = false
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (pendingRef.current) return
    pendingRef.current = true
    setLoading(true)
    setDeleteError("")
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) {
        setDeleteError(data.error ?? "Silme işlemi başarısız.")
        return
      }
      setDeleteId(null)
      router.refresh()
    } finally {
      pendingRef.current = false
      setLoading(false)
    }
  }

  async function handleRoleChange(id: string, role: string) {
    if (pendingRef.current) return
    pendingRef.current = true
    setLoading(true)
    try {
      await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      })
      setChangeRoleUser(null)
      router.refresh()
    } finally {
      pendingRef.current = false
      setLoading(false)
    }
  }

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })

  return (
    <div className="space-y-4">
      {/* Tab + Add button */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-white border border-black/[0.06] rounded-xl p-1 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === t.id
                  ? "bg-[#212121] text-white"
                  : "text-[#6e6e73] hover:text-[#1c1c1c]"
              }`}
            >
              {t.label}
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${
                activeTab === t.id ? "bg-white/20 text-white" : "bg-[#f5f5f5] text-[#aeaeb2]"
              }`}>{t.count}</span>
            </button>
          ))}
        </div>
        <button
          onClick={() => { setShowAdd(true); setForm(f => ({ ...f, role: activeTab })) }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#212121] text-white text-[13px] font-semibold rounded-xl shadow-sm hover:bg-[#383838] hover:shadow transition-colors cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Ekle
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold text-[#1c1c1c]">Yeni Kullanıcı Ekle</p>
            <button onClick={() => { setShowAdd(false); setError("") }} className="text-[#aeaeb2] hover:text-[#1c1c1c] transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#6e6e73]">Ad Soyad</label>
              <input
                type="text"
                placeholder="Ahmet Yılmaz"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#6e6e73]">E-posta</label>
              <input
                type="email"
                placeholder="ornek@mail.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#6e6e73]">Şifre</label>
              <input
                type="password"
                placeholder="En az 6 karakter"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#6e6e73]">Rol</label>
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value as Tab }))}
                className={inputCls}
              >
                <option value="APPLICANT">Üye</option>
                <option value="JURY">Jüri</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>

          {error && (
            <p className="text-[12px] text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">{error}</p>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => { setShowAdd(false); setError("") }}
              className="px-4 py-2 text-[13px] text-[#6e6e73] hover:text-[#1c1c1c] transition-colors cursor-pointer"
            >
              İptal
            </button>
            <button
              onClick={handleAdd}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#212121] text-white text-[13px] font-semibold rounded-xl shadow-sm hover:bg-[#383838] hover:shadow disabled:opacity-50 transition-colors cursor-pointer"
            >
              {loading ? "Ekleniyor…" : <><ChevronRight className="w-3.5 h-3.5" /> Kullanıcı Ekle</>}
            </button>
          </div>
        </div>
      )}

      {/* User list */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-[13px] text-[#aeaeb2]">Bu kategoride kullanıcı yok.</p>
          </div>
        ) : (
          <ul className="divide-y divide-black/[0.04]">
            {filtered.map(u => (
              <li key={u.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#f4f4f4] transition-colors">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-[#f5f5f5] border border-black/[0.06] flex items-center justify-center shrink-0">
                  <span className="text-[12px] font-semibold text-[#6e6e73]">
                    {(u.name ?? u.email).charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[13px] font-medium text-[#1c1c1c]">
                      {u.name ?? <span className="text-[#aeaeb2]">İsimsiz</span>}
                    </p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role]}`}>
                      {ROLE_LABELS[u.role]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <p className="text-[11px] text-[#aeaeb2]">{u.email}</p>
                    {u.role === "APPLICANT" && u._count.applications > 0 && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-[#d1d1d6]" />
                        <p className="text-[11px] text-[#aeaeb2]">{u._count.applications} başvuru</p>
                      </>
                    )}
                    {u.role === "JURY" && u._count.juryAssignments > 0 && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-[#d1d1d6]" />
                        <p className="text-[11px] text-[#aeaeb2]">{u._count.juryAssignments} atama</p>
                      </>
                    )}
                    <span className="w-1 h-1 rounded-full bg-[#d1d1d6]" />
                    <p className="text-[11px] text-[#aeaeb2]">{fmt(u.createdAt)}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setChangeRoleUser(u)}
                    title="Rolü Değiştir"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[#aeaeb2] hover:text-[#6e6e73] hover:bg-[#f5f5f5] transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  {u.id !== currentUserId && (
                    <button
                      onClick={() => setDeleteId(u.id)}
                      title="Kullanıcıyı Sil"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[#aeaeb2] hover:text-red-500 hover:bg-red-100 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Delete confirm modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-xl p-6 max-w-sm w-full space-y-4">
            <p className="text-[15px] font-semibold text-[#1c1c1c]">Kullanıcıyı sil</p>
            <p className="text-[13px] text-[#6e6e73] leading-relaxed">
              Bu kullanıcıyı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </p>
            {deleteError && (
              <p className="text-[12px] text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">{deleteError}</p>
            )}
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => { setDeleteId(null); setDeleteError("") }}
                className="px-4 py-2 text-[13px] text-[#6e6e73] hover:text-[#1c1c1c] transition-colors cursor-pointer"
              >
                İptal
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={loading}
                className="px-4 py-2 bg-red-500 text-white text-[13px] font-semibold rounded-xl shadow-sm hover:bg-red-600 hover:shadow disabled:opacity-50 transition-colors cursor-pointer"
              >
                {loading ? "Siliniyor…" : "Sil"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role change modal */}
      {changeRoleUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-xl p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[15px] font-semibold text-[#1c1c1c]">Rolü Değiştir</p>
              <button onClick={() => setChangeRoleUser(null)} className="text-[#aeaeb2] hover:text-[#1c1c1c] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[13px] text-[#6e6e73]">
              <span className="font-medium text-[#1c1c1c]">{changeRoleUser.name ?? changeRoleUser.email}</span> için yeni rol seçin.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(["APPLICANT", "JURY", "ADMIN"] as const).map(r => (
                <button
                  key={r}
                  onClick={() => handleRoleChange(changeRoleUser.id, r)}
                  disabled={loading || changeRoleUser.role === r}
                  className={`py-2.5 rounded-xl text-[13px] font-semibold transition-colors cursor-pointer disabled:opacity-40 ${
                    changeRoleUser.role === r
                      ? "bg-[#212121] text-white"
                      : "bg-[#f5f5f5] text-[#6e6e73] hover:bg-[#ebebeb]"
                  }`}
                >
                  {ROLE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

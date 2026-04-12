"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const inputCls = "w-full px-3.5 py-2.5 bg-[#f5f5f5] border border-transparent rounded-xl text-[14px] text-[#1c1c1c] focus:outline-none focus:ring-2 focus:ring-[#fab758]/50 focus:bg-white focus:border-[#fab758]/30 transition-all"

export function CreateProgramForm() {
  const router = useRouter()
  const [form, setForm] = useState({ title: "", startDate: "", endDate: "" })
  const [error, setError]     = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
    setSuccess(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/admin/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:     form.title,
          startDate: new Date(form.startDate).toISOString(),
          endDate:   new Date(form.endDate).toISOString(),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Hata."); return }
      setForm({ title: "", startDate: "", endDate: "" })
      setSuccess(true)
      router.refresh()
    } catch {
      setError("Beklenmedik hata.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="prog-title" className="block text-[12px] font-medium text-[#6e6e73] mb-1.5">
          Program Adı
        </label>
        <input
          id="prog-title" name="title" type="text" value={form.title}
          onChange={handleChange} required
          placeholder="örn. 2025 Bahar Programı"
          className={inputCls}
        />
      </div>

      <div>
        <label htmlFor="prog-startDate" className="block text-[12px] font-medium text-[#6e6e73] mb-1.5">
          Başlangıç
        </label>
        <input
          id="prog-startDate" name="startDate" type="datetime-local"
          value={form.startDate} onChange={handleChange} required
          className={inputCls}
        />
      </div>

      <div>
        <label htmlFor="prog-endDate" className="block text-[12px] font-medium text-[#6e6e73] mb-1.5">
          Bitiş
        </label>
        <input
          id="prog-endDate" name="endDate" type="datetime-local"
          value={form.endDate} onChange={handleChange} required
          className={inputCls}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
          <p className="text-[13px] text-red-600">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5">
          <p className="text-[13px] text-emerald-700">Program oluşturuldu.</p>
        </div>
      )}

      <button
        type="submit" disabled={loading}
        className="w-full py-2.5 bg-[#212121] text-white text-[13px] font-semibold rounded-xl shadow-sm hover:bg-[#383838] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        {loading ? "Oluşturuluyor…" : "Program Oluştur"}
      </button>
    </form>
  )
}

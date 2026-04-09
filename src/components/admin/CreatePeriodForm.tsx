"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function CreatePeriodForm() {
  const router = useRouter()
  const [form, setForm] = useState({ title: "", startDate: "", endDate: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/admin/periods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          startDate: new Date(form.startDate).toISOString(),
          endDate: new Date(form.endDate).toISOString(),
        }),
      })

      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Hata."); return }

      setForm({ title: "", startDate: "", endDate: "" })
      router.refresh()
    } catch {
      setError("Beklenmedik hata.")
    } finally {
      setLoading(false)
    }
  }

  const inputCls = "w-full px-3.5 py-2.5 bg-[#f5f5f5] border border-transparent rounded-xl text-[14px] text-[#1c1c1c] focus:outline-none focus:ring-2 focus:ring-[#fab758]/50 focus:bg-white focus:border-[#fab758]/30 transition-all"

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-[12px] font-medium text-[#6e6e73] mb-1.5">
          Dönem Adı
        </label>
        <input
          id="title" name="title" type="text" value={form.title}
          onChange={handleChange} required
          placeholder="örn. 2025 Bahar Dönemi"
          className={inputCls}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-[12px] font-medium text-[#6e6e73] mb-1.5">
            Başlangıç Tarihi
          </label>
          <input
            id="startDate" name="startDate" type="datetime-local"
            value={form.startDate} onChange={handleChange} required
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-[12px] font-medium text-[#6e6e73] mb-1.5">
            Bitiş Tarihi
          </label>
          <input
            id="endDate" name="endDate" type="datetime-local"
            value={form.endDate} onChange={handleChange} required
            className={inputCls}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
          <p className="text-[13px] text-red-600">{error}</p>
        </div>
      )}

      <button
        type="submit" disabled={loading}
        className="px-4 py-2.5 bg-[#212121] text-white text-[13px] font-semibold rounded-xl hover:bg-[#2d2d2d] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        {loading ? "Oluşturuluyor…" : "Dönem Oluştur"}
      </button>
    </form>
  )
}

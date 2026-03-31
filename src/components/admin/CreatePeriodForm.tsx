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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="title" className="text-sm font-medium">Dönem Adı</label>
        <input
          id="title" name="title" type="text" value={form.title}
          onChange={handleChange} required
          placeholder="örn. 2025 Bahar Dönemi"
          className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="startDate" className="text-sm font-medium">Başlangıç Tarihi</label>
          <input
            id="startDate" name="startDate" type="datetime-local"
            value={form.startDate} onChange={handleChange} required
            className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="endDate" className="text-sm font-medium">Bitiş Tarihi</label>
          <input
            id="endDate" name="endDate" type="datetime-local"
            value={form.endDate} onChange={handleChange} required
            className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{error}</p>
      )}

      <button
        type="submit" disabled={loading}
        className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "Oluşturuluyor…" : "Dönem Oluştur"}
      </button>
    </form>
  )
}

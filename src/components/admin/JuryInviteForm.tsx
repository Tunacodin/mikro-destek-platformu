"use client"

import { useState } from "react"

export function JuryInviteForm() {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [devLink, setDevLink] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("loading")
    setMessage("")
    setDevLink("")

    try {
      const res = await fetch("/api/admin/jury/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: name || undefined }),
      })

      const data = await res.json()

      if (!res.ok) {
        setStatus("error")
        setMessage(data.error ?? "Davet gönderilemedi.")
        return
      }

      setStatus("success")
      setMessage(`Davet gönderildi: ${email}`)
      if (data.devLink) setDevLink(data.devLink)
      setEmail("")
      setName("")
    } catch {
      setStatus("error")
      setMessage("Beklenmedik bir hata oluştu.")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="invite-email" className="text-sm font-medium">
            E-posta <span className="text-red-500">*</span>
          </label>
          <input
            id="invite-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="juri@ornek.com"
            className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-[#fab758] focus:border-transparent"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="invite-name" className="text-sm font-medium">
            Ad Soyad <span className="text-muted-foreground font-normal">(isteğe bağlı)</span>
          </label>
          <input
            id="invite-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Adı Soyadı"
            className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-[#fab758] focus:border-transparent"
          />
        </div>
      </div>

      {status === "success" && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-3">
          {message}
          {devLink && (
            <div className="mt-2">
              <span className="font-medium">Geliştirme linki: </span>
              <a href={devLink} className="underline break-all" target="_blank" rel="noreferrer">
                {devLink}
              </a>
            </div>
          )}
        </div>
      )}

      {status === "error" && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="px-4 py-2 bg-[#212121] text-white text-sm font-medium rounded-md hover:bg-[#fab758] hover:text-[#212121] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {status === "loading" ? "Gönderiliyor…" : "Davet Gönder"}
      </button>
    </form>
  )
}

"use client"

import { useState } from "react"
import { CheckCircle2 } from "lucide-react"

export function JuryInviteForm() {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [magicLink, setMagicLink] = useState("")
  const [emailError, setEmailError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("loading")
    setMessage("")
    setMagicLink("")
    setEmailError("")

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
      setMessage(data.message ?? `Davet gönderildi: ${email}`)
      if (data.magicLink) setMagicLink(data.magicLink)
      if (data.emailError) setEmailError(data.emailError)
      setEmail("")
      setName("")
    } catch {
      setStatus("error")
      setMessage("Beklenmedik bir hata oluştu.")
    }
  }

  const inputCls = "w-full px-3.5 py-2.5 bg-[#f5f5f5] border border-transparent rounded-xl text-[14px] text-[#1c1c1c] placeholder:text-[#c7c7cc] focus:outline-none focus:ring-2 focus:ring-[#fab758]/50 focus:bg-white focus:border-[#fab758]/30 transition-all"

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="invite-email" className="block text-[12px] font-medium text-[#6e6e73] mb-1.5">
            E-posta <span className="text-red-500">*</span>
          </label>
          <input
            id="invite-email" type="email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            required placeholder="juri@ornek.com"
            className={inputCls}
          />
        </div>

        <div>
          <label htmlFor="invite-name" className="block text-[12px] font-medium text-[#6e6e73] mb-1.5">
            Ad Soyad <span className="font-normal text-[#aeaeb2]">(isteğe bağlı)</span>
          </label>
          <input
            id="invite-name" type="text" value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Adı Soyadı"
            className={inputCls}
          />
        </div>
      </div>

      {status === "success" && (
        <div className="space-y-2">
          <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div className="text-[13px] text-emerald-700 min-w-0">
              <p>{message}</p>
              {magicLink && (
                <div className="mt-2 space-y-1">
                  <p className="font-semibold text-emerald-800">Davet Linki:</p>
                  <p className="break-all text-[11px] font-mono bg-emerald-100 px-2 py-1.5 rounded-lg">{magicLink}</p>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(magicLink)}
                    className="text-[11px] font-semibold text-emerald-700 underline cursor-pointer"
                  >
                    Kopyala
                  </button>
                </div>
              )}
            </div>
          </div>
          {emailError && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
              <p className="text-[12px] text-amber-700"><span className="font-semibold">E-posta hatası:</span> {emailError}</p>
            </div>
          )}
        </div>
      )}

      {status === "error" && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <p className="text-[13px] text-red-600">{message}</p>
        </div>
      )}

      <button
        type="submit" disabled={status === "loading"}
        className="px-4 py-2.5 bg-[#212121] text-white text-[13px] font-semibold rounded-xl hover:bg-[#2d2d2d] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        {status === "loading" ? "Gönderiliyor…" : "Davet Gönder"}
      </button>
    </form>
  )
}

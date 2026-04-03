"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") ?? "/"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("E-posta veya şifre hatalı.")
        return
      }

      router.push(callbackUrl)
      router.refresh()
    } catch {
      setError("Beklenmedik bir hata oluştu.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-[17px] font-semibold text-[#1c1c1c]">Giriş Yap</h1>
        <p className="text-sm text-[#6e6e73]">Hesabınıza erişmek için bilgilerinizi girin.</p>
      </div>

      {error && (
        <div className="text-[13px] text-red-600 bg-red-50 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label htmlFor="email" className="block text-[13px] font-medium text-[#1c1c1c] mb-1.5">
            E-posta
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="ornek@email.com"
            className="w-full px-3.5 py-2.5 bg-[#f5f5f5] border-0 rounded-xl text-sm text-[#1c1c1c] placeholder:text-[#aeaeb2] focus:outline-none focus:ring-2 focus:ring-[#fab758]/40 focus:bg-white transition-all"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-[13px] font-medium text-[#1c1c1c] mb-1.5">
            Şifre
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full px-3.5 py-2.5 bg-[#f5f5f5] border-0 rounded-xl text-sm text-[#1c1c1c] placeholder:text-[#aeaeb2] focus:outline-none focus:ring-2 focus:ring-[#fab758]/40 focus:bg-white transition-all"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-[#212121] text-white text-sm font-semibold rounded-xl hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
      >
        {loading ? "Giriş yapılıyor…" : "Giriş Yap"}
      </button>
    </form>
  )
}

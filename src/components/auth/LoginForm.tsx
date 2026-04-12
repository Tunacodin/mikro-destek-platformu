"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { Eye, EyeOff, CheckCircle2 } from "lucide-react"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") ?? "/"
  const registered = searchParams.get("registered") === "1"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <h1 className="text-[18px] font-semibold text-[#1c1c1c] tracking-tight">Giriş Yap</h1>
        <p className="text-[13px] text-[#6e6e73]">Hesabınıza erişmek için bilgilerinizi girin</p>
      </div>

      {registered && (
        <div className="flex items-start gap-2.5 text-[13px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          Kayıt başarılı! Şimdi giriş yapabilirsiniz.
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2.5 text-[13px] text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <span className="mt-0.5 shrink-0">⚠</span>
          {error}
        </div>
      )}

      <div className="space-y-3.5">
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
            className="w-full px-3.5 py-2.5 bg-[#f5f5f5] border border-transparent rounded-xl text-[14px] text-[#1c1c1c] placeholder:text-[#c7c7cc] focus:outline-none focus:ring-2 focus:ring-[#fab758]/50 focus:bg-white focus:border-[#fab758]/30 transition-all"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-[13px] font-medium text-[#1c1c1c] mb-1.5">
            Şifre
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 pr-10 bg-[#f5f5f5] border border-transparent rounded-xl text-[14px] text-[#1c1c1c] placeholder:text-[#c7c7cc] focus:outline-none focus:ring-2 focus:ring-[#fab758]/50 focus:bg-white focus:border-[#fab758]/30 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aeaeb2] hover:text-[#6e6e73] transition-colors cursor-pointer"
              aria-label={showPassword ? "Şifreyi Gizle" : "Şifreyi Göster"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-[#212121] text-white text-[14px] font-semibold rounded-xl shadow-sm hover:bg-[#383838] hover:shadow disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        {loading ? "Giriş yapılıyor…" : "Giriş Yap"}
      </button>

      <p className="text-center text-[13px] text-[#6e6e73]">
        Hesabınız yok mu?{" "}
        <Link href="/register" className="font-semibold text-[#1c1c1c] hover:opacity-80 underline-offset-2 hover:underline transition-all">
          Kayıt olun
        </Link>
      </p>
    </form>
  )
}

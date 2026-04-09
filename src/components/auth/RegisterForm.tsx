"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Info } from "lucide-react"

export function RegisterForm() {
  const router = useRouter()

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirm: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (form.password !== form.passwordConfirm) {
      setError("Şifreler eşleşmiyor.")
      return
    }

    if (form.password.length < 8) {
      setError("Şifre en az 8 karakter olmalıdır.")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Kayıt sırasında hata oluştu.")
        return
      }

      router.push("/login?registered=1")
    } catch {
      setError("Beklenmedik bir hata oluştu.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <h1 className="text-[18px] font-semibold text-[#1c1c1c] tracking-tight">Hesap Oluştur</h1>
        <p className="text-[13px] text-[#6e6e73]">Mikro Destek Fonu'na başvurmak için kayıt olun</p>
      </div>

      {/* Circle bilgi kutusu */}
      <div className="flex items-start gap-2.5 bg-[#fab758]/[0.08] border border-[#fab758]/20 rounded-xl px-4 py-3">
        <Info className="w-4 h-4 text-[#fab758] shrink-0 mt-0.5" />
        <p className="text-[12px] text-[#1c1c1c] leading-relaxed">
          Kayıt için <span className="font-semibold">Divizyon Circle topluluğuna</span> üye olmanız gerekiyor. Üyeliğinizde kayıtlı e-posta adresinizi kullanın.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 text-[13px] text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <span className="mt-0.5 shrink-0">⚠</span>
          {error}
        </div>
      )}

      <div className="space-y-3.5">
        {/* Ad Soyad */}
        <div>
          <label htmlFor="name" className="block text-[13px] font-medium text-[#1c1c1c] mb-1.5">
            Ad Soyad
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            required
            autoComplete="name"
            placeholder="Adınız Soyadınız"
            className="w-full px-3.5 py-2.5 bg-[#f5f5f5] border border-transparent rounded-xl text-[14px] text-[#1c1c1c] placeholder:text-[#c7c7cc] focus:outline-none focus:ring-2 focus:ring-[#fab758]/50 focus:bg-white focus:border-[#fab758]/30 transition-all"
          />
        </div>

        {/* E-posta */}
        <div>
          <label htmlFor="email" className="block text-[13px] font-medium text-[#1c1c1c] mb-1.5">
            E-posta
            <span className="ml-1.5 text-[11px] font-normal text-[#aeaeb2]">(Circle üyelik e-postanız)</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            autoComplete="email"
            placeholder="ornek@email.com"
            className="w-full px-3.5 py-2.5 bg-[#f5f5f5] border border-transparent rounded-xl text-[14px] text-[#1c1c1c] placeholder:text-[#c7c7cc] focus:outline-none focus:ring-2 focus:ring-[#fab758]/50 focus:bg-white focus:border-[#fab758]/30 transition-all"
          />
        </div>

        {/* Şifre */}
        <div>
          <label htmlFor="password" className="block text-[13px] font-medium text-[#1c1c1c] mb-1.5">
            Şifre
            <span className="ml-1.5 text-[11px] font-normal text-[#aeaeb2]">(en az 8 karakter)</span>
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
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

        {/* Şifre Tekrar */}
        <div>
          <label htmlFor="passwordConfirm" className="block text-[13px] font-medium text-[#1c1c1c] mb-1.5">
            Şifre Tekrar
          </label>
          <div className="relative">
            <input
              id="passwordConfirm"
              name="passwordConfirm"
              type={showConfirm ? "text" : "password"}
              value={form.passwordConfirm}
              onChange={handleChange}
              required
              autoComplete="new-password"
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 pr-10 bg-[#f5f5f5] border border-transparent rounded-xl text-[14px] text-[#1c1c1c] placeholder:text-[#c7c7cc] focus:outline-none focus:ring-2 focus:ring-[#fab758]/50 focus:bg-white focus:border-[#fab758]/30 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aeaeb2] hover:text-[#6e6e73] transition-colors cursor-pointer"
              aria-label={showConfirm ? "Şifreyi Gizle" : "Şifreyi Göster"}
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {/* Şifre eşleşme göstergesi */}
          {form.passwordConfirm.length > 0 && (
            <p className={`text-[11px] mt-1.5 ${
              form.password === form.passwordConfirm ? "text-emerald-600" : "text-red-500"
            }`}>
              {form.password === form.passwordConfirm ? "✓ Şifreler eşleşiyor" : "Şifreler eşleşmiyor"}
            </p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-[#212121] text-white text-[14px] font-semibold rounded-xl hover:bg-[#2d2d2d] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        {loading ? "Kayıt yapılıyor…" : "Kayıt Ol"}
      </button>

      <p className="text-center text-[13px] text-[#6e6e73]">
        Zaten hesabınız var mı?{" "}
        <Link href="/login" className="font-semibold text-[#1c1c1c] hover:opacity-60 transition-opacity">
          Giriş yapın
        </Link>
      </p>
    </form>
  )
}

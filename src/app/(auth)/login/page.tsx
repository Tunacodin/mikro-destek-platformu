import { Suspense } from "react"
import Image from "next/image"
import { LoginForm } from "@/components/auth/LoginForm"

export const metadata = { title: "Giriş Yap — Mikro Destek Fonu" }

export default function LoginPage() {
  return (
    <div className="space-y-6">
      {/* Logo + başlık */}
      <div className="text-center space-y-2">
        <Image
          src="/logo-divizyon.png"
          alt="Divizyon"
          width={130}
          height={34}
          priority
          className="mx-auto"
        />
        <div className="space-y-0.5">
          <p className="text-[14px] font-semibold text-[#1c1c1c]">Mikro Destek Fonu</p>

        </div>
      </div>

      {/* Giriş kartı */}
      <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-black/[0.04] p-7">
        <Suspense
          fallback={<div className="h-52 animate-pulse rounded-xl bg-[#f5f5f5]" />}
        >
          <LoginForm />
        </Suspense>
      </div>

      <p className="text-center text-[11px] text-[#aeaeb2]">
        Divizyon © {new Date().getFullYear()}
      </p>
    </div>
  )
}

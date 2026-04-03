import { Suspense } from "react"
import Image from "next/image"
import { LoginForm } from "@/components/auth/LoginForm"

export const metadata = { title: "Giriş Yap — Mikro Destek Fonu" }

export default function LoginPage() {
  return (
    <div className="space-y-6">
      {/* Logo */}
      <div className="text-center space-y-1.5">
        <Image
          src="/logo-divizyon.png"
          alt="Divizyon"
          width={130}
          height={34}
          priority
          className="mx-auto"
        />
        <p className="text-sm text-[#6e6e73]">Mikro Destek Fonu</p>
      </div>

      {/* Kart */}
      <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.08)] p-8">
        <Suspense
          fallback={<div className="h-52 animate-pulse rounded-xl bg-[#f5f5f5]" />}
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}

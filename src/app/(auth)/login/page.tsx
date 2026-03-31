import { Suspense } from "react"
import Image from "next/image"
import { LoginForm } from "@/components/auth/LoginForm"

export const metadata = { title: "Giriş Yap — Mikro Destek Fonu" }

export default function LoginPage() {
  return (
    <div className="space-y-8">
      <Image src="/logo-divizyon.png" alt="Divizyon" width={160} height={40} priority />
      <Suspense fallback={<div className="border rounded-lg p-8 h-56 animate-pulse bg-card" />}>
        <LoginForm />
      </Suspense>
    </div>
  )
}

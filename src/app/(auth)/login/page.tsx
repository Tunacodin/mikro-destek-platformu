import { Suspense } from "react"
import Image from "next/image"
import { LoginForm } from "@/components/auth/LoginForm"

export const metadata = { title: "Giriş Yap — Mikro Destek Fonu" }

export default function LoginPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Image src="/logo-divizyon.png" alt="Divizyon" width={160} height={40} priority />
        <p className="text-muted-foreground text-sm">Mikro Destek Fonu Yönetim Paneli</p>
      </div>
      <Suspense fallback={<div className="border rounded-lg p-8 h-56 animate-pulse bg-card" />}>
        <LoginForm />
      </Suspense>
    </div>
  )
}

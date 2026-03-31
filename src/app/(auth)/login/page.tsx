import { Suspense } from "react"
import { LoginForm } from "@/components/auth/LoginForm"

export const metadata = { title: "Giriş Yap — Mikro Destek Fonu" }

export default function LoginPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Giriş Yap</h1>
        <p className="text-base text-muted-foreground mt-2">
          Mikro Destek Fonu yönetim paneline hoş geldiniz.
        </p>
      </div>
      <Suspense fallback={<div className="border rounded-lg p-8 h-56 animate-pulse bg-card" />}>
        <LoginForm />
      </Suspense>
    </div>
  )
}

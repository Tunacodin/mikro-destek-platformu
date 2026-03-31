import { RegisterForm } from "@/components/auth/RegisterForm"

export const metadata = { title: "Kayıt Ol — Mikro Destek Fonu" }

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Kayıt Ol</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Circle topluluğu e-postanızla kayıt olun
        </p>
      </div>
      <RegisterForm />
    </div>
  )
}

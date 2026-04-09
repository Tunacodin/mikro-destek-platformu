import Image from "next/image"
import { RegisterForm } from "@/components/auth/RegisterForm"

export const metadata = { title: "Kayıt Ol — Mikro Destek Fonu" }

export default function RegisterPage() {
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

      {/* Kayıt kartı */}
      <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-black/[0.04] p-7">
        <RegisterForm />
      </div>

      <p className="text-center text-[11px] text-[#aeaeb2]">
        Divizyon © {new Date().getFullYear()}
      </p>
    </div>
  )
}

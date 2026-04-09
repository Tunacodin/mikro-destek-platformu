import { FloatingCategories } from "@/components/auth/FloatingCategories"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[#f5f5f5] flex items-center justify-center px-4 py-10 overflow-hidden">
      {/* Arka plan animasyonu */}
      <FloatingCategories />

      {/* Merkez içerik */}
      <div className="relative z-10 w-full max-w-[390px]">
        {children}
      </div>
    </div>
  )
}

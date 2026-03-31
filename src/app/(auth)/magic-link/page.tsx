import { Suspense } from "react"
import { MagicLinkHandler } from "./MagicLinkHandler"

export const metadata = { title: "Giriş Yapılıyor… — Mikro Destek Fonu" }

export default function MagicLinkPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Mikro Destek Fonu</h1>
        <p className="text-sm text-muted-foreground mt-1">Jüri Girişi</p>
      </div>
      <Suspense fallback={
        <div className="bg-white border rounded-lg p-8 shadow-sm text-center">
          <p className="text-sm text-muted-foreground">Bağlantı doğrulanıyor…</p>
        </div>
      }>
        <MagicLinkHandler />
      </Suspense>
    </div>
  )
}

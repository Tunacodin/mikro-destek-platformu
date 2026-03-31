import { redirect } from "next/navigation"
import Image from "next/image"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dev Portal — Mikro Destek Fonu",
  icons: { icon: "/favicon.png", shortcut: "/favicon.png" },
}

export default function DevPortalPage() {
  if (process.env.NODE_ENV !== "development") redirect("/")

  const services = [
    {
      name: "MDF Uygulaması",
      description: "Next.js uygulama — Admin, Başvuru ve Jüri panelleri",
      url: "http://localhost",
      icon: "🚀",
      credentials: [{ label: "Admin", value: "admin@mikrodestekfonu.com / Admin1234!" }],
    },
    {
      name: "pgAdmin",
      description: "PostgreSQL veritabanı yönetim arayüzü",
      url: "http://localhost:5050",
      icon: "🐘",
      credentials: [{ label: "Giriş", value: "admin@mikrodestekfonu.com / Admin1234!" }],
    },
    {
      name: "MinIO Console",
      description: "S3-uyumlu dosya depolama arayüzü",
      url: "http://localhost:9001",
      icon: "📦",
      credentials: [{ label: "Giriş", value: "mdfminio / mdfminio123" }],
    },
    {
      name: "Prisma Studio",
      description: "Veritabanı içeriğini görsel olarak incele ve düzenle",
      url: "http://localhost:5555",
      icon: "🔷",
      credentials: [{ label: "DB", value: "mdfuser / mdfpass123 → mikro_destek" }],
    },
    {
      name: "API Docs",
      description: "REST API dokümantasyonu — Scalar ile",
      url: "http://localhost:3000/api/reference",
      icon: "📄",
      credentials: [],
    },
  ]

  return (
    <div className="min-h-screen bg-[#f6f7f9] overscroll-none">
      {/* Header */}
      <header className="bg-[#212121] px-8 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image src="/logo-light.png" alt="Divizyon" width={120} height={30} priority />
            <div>
              <p className="text-white font-semibold text-base">Mikro Destek Fonu</p>
              <p className="text-white/40 text-xs">Geliştirici Portalı</p>
            </div>
          </div>
          <span className="text-xs font-medium bg-[#fab758] text-[#212121] px-3 py-1 rounded-full">
            DEV
          </span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-8 py-10">
        <h2 className="text-lg font-semibold text-[#212121] mb-4">Servisler</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s) => (
            <a
              key={s.name}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white border border-[#e9ecef] rounded-xl p-5 hover:border-[#fab758] hover:shadow-sm transition-all flex flex-col"
            >
              <div className="mb-4">
                <span className="text-4xl">{s.icon}</span>
              </div>
              <p className="font-bold text-[#212121] text-lg">{s.name}</p>
              <p className="text-sm text-[#60697b] mt-1.5 leading-relaxed">{s.description}</p>

              {s.credentials.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[#e9ecef] space-y-1.5">
                  {s.credentials.map((c) => (
                    <div key={c.label} className="flex items-start gap-2">
                      <span className="text-xs text-[#60697b] shrink-0 pt-0.5">{c.label}</span>
                      <code className="text-xs font-mono text-[#212121] bg-[#f6f7f9] px-2 py-0.5 rounded break-all">
                        {c.value}
                      </code>
                    </div>
                  ))}
                </div>
              )}

              <p className="mt-auto pt-4 text-sm font-semibold text-[#fab758] group-hover:underline">
                Aç →
              </p>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

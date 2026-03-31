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
      url: "http://localhost",
      credentials: [{ label: "Admin", value: "admin@mikrodestekfonu.com / Admin1234!" }],
    },
    {
      name: "pgAdmin",
      url: "http://localhost:5050",
      credentials: [{ label: "Giriş", value: "admin@mikrodestekfonu.com / Admin1234!" }],
    },
    {
      name: "MinIO Console",
      url: "http://localhost:9001",
      credentials: [{ label: "Giriş", value: "mdfminio / mdfminio123" }],
    },
    {
      name: "Prisma Studio",
      url: "http://localhost:5555",
      credentials: [{ label: "DB", value: "mdfuser / mdfpass123 → mikro_destek" }],
    },
    {
      name: "API Docs",
      url: "http://localhost:3000/api/reference",
      credentials: [],
    },
  ]

  return (
    <div className="min-h-screen bg-white overscroll-none">
      <header className="border-b border-[#e9ecef] px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Image src="/logo-dark.png" alt="Divizyon" width={110} height={28} priority />
          <span className="text-xs font-mono text-[#60697b] tracking-widest uppercase">dev</span>
        </div>
      </header>

      <div className="px-8 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-sm font-semibold text-[#212121] uppercase tracking-widest mb-8">
          Geliştirici Portalı
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s) => (
            <a
              key={s.name}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-[#212121] border border-[#212121] rounded-xl p-5 hover:border-[#fab758] hover:shadow-sm transition-all flex flex-col"
            >
              <p className="font-bold text-[#fab758] text-lg">{s.name}</p>

              {s.credentials.length > 0 && (
                <div className="mt-3 space-y-1">
                  {s.credentials.map((c) => (
                    <div key={c.label} className="flex items-start gap-2">
                      <span className="text-xs text-white/40 shrink-0 pt-0.5">{c.label}</span>
                      <span className="text-xs text-white/80 break-all">{c.value}</span>
                    </div>
                  ))}
                </div>
              )}

              <p className="mt-auto pt-4 text-xs text-white/30 truncate">
                {s.url}
              </p>
            </a>
          ))}
        </div>
      </div>
      </div>
    </div>
  )
}

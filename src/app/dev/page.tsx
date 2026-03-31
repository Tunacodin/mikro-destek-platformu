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

      <div className="max-w-4xl mx-auto px-8 py-12">
        <h1 className="text-sm font-semibold text-[#212121] uppercase tracking-widest mb-8">
          Geliştirici Portalı
        </h1>

        <div className="divide-y divide-[#e9ecef] border border-[#e9ecef]">
          {services.map((s) => (
            <div key={s.name} className="flex items-center justify-between gap-8 px-5 py-4 hover:bg-[#f6f7f9] transition-colors">
              <div className="flex items-center gap-6 min-w-0">
                <p className="text-sm font-medium text-[#212121] w-36 shrink-0">{s.name}</p>
                {s.credentials.map((c) => (
                  <div key={c.label} className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-[#60697b] shrink-0">{c.label}</span>
                    <code className="text-xs font-mono text-[#212121] bg-[#f6f7f9] border border-[#e9ecef] px-2 py-0.5 truncate">
                      {c.value}
                    </code>
                  </div>
                ))}
              </div>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-[#212121] hover:text-[#fab758] transition-colors shrink-0 underline underline-offset-4"
              >
                {s.url}
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

import { redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"

// Yalnızca geliştirme ortamında erişilebilir
export default function DevPortalPage() {
  if (process.env.NODE_ENV !== "development") redirect("/")

  const services = [
    {
      name: "MDF Uygulaması",
      description: "Next.js uygulama — Admin, Başvuru ve Jüri panelleri",
      url: "http://localhost",
      port: ":80",
      icon: "🚀",
      color: "#212121",
    },
    {
      name: "pgAdmin",
      description: "PostgreSQL veritabanı yönetim arayüzü",
      url: "http://localhost:5050",
      port: ":5050",
      icon: "🐘",
      color: "#336791",
    },
    {
      name: "MinIO Console",
      description: "S3-uyumlu dosya depolama arayüzü",
      url: "http://localhost:9001",
      port: ":9001",
      icon: "📦",
      color: "#C72E49",
    },
    {
      name: "Prisma Studio",
      description: "Veritabanı içeriğini görsel olarak incele ve düzenle",
      url: "http://localhost:5555",
      port: ":5555",
      icon: "🔷",
      color: "#5A67D8",
    },
    {
      name: "API Docs",
      description: "REST API dokümantasyonu — Scalar ile",
      url: "http://localhost:3000/api/reference",
      port: ":3000/api/reference",
      icon: "📄",
      color: "#16A34A",
    },
  ]

  const credentials = [
    { label: "Admin Girişi",    value: "admin@mikrodestekfonu.com / Admin1234!" },
    { label: "PostgreSQL",      value: "mdfuser / mdfpass123 → mikro_destek" },
    { label: "MinIO",           value: "mdfminio / mdfminio123" },
    { label: "pgAdmin",         value: "admin@mikrodestekfonu.com / Admin1234!" },
  ]

  return (
    <div className="min-h-screen bg-[#f6f7f9]">
      {/* Header */}
      <header className="bg-[#212121] px-8 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white rounded-lg px-3 py-1.5">
              <Image src="/logo.png" alt="Divizyon" width={100} height={26} priority />
            </div>
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

      <div className="max-w-5xl mx-auto px-8 py-10 space-y-10">
        {/* Servisler */}
        <section>
          <h2 className="text-lg font-semibold text-[#212121] mb-4">Servisler</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((s) => (
              <a
                key={s.name}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white border border-[#e9ecef] rounded-xl p-5 hover:border-[#fab758] hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-2xl">{s.icon}</span>
                  <span className="text-xs text-[#60697b] font-mono bg-[#f6f7f9] px-2 py-0.5 rounded">
                    {s.port}
                  </span>
                </div>
                <p className="font-semibold text-[#212121] text-sm">{s.name}</p>
                <p className="text-xs text-[#60697b] mt-1 leading-relaxed">{s.description}</p>
                <p className="mt-3 text-xs font-medium text-[#fab758] group-hover:underline">
                  Aç →
                </p>
              </a>
            ))}
          </div>
        </section>

        {/* Hızlı Erişim Bilgileri */}
        <section>
          <h2 className="text-lg font-semibold text-[#212121] mb-4">Erişim Bilgileri</h2>
          <div className="bg-white border border-[#e9ecef] rounded-xl divide-y divide-[#e9ecef]">
            {credentials.map((c) => (
              <div key={c.label} className="flex items-center justify-between px-5 py-3.5">
                <span className="text-sm text-[#60697b]">{c.label}</span>
                <code className="text-sm font-mono text-[#212121] bg-[#f6f7f9] px-3 py-1 rounded">
                  {c.value}
                </code>
              </div>
            ))}
          </div>
        </section>

        {/* Hızlı linkler */}
        <section>
          <h2 className="text-lg font-semibold text-[#212121] mb-4">Hızlı Bağlantılar</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Admin Girişi",    href: "http://localhost/login" },
              { label: "Admin Paneli",    href: "http://localhost/admin/dashboard" },
              { label: "Başvuru Paneli",  href: "http://localhost/dashboard" },
              { label: "Jüri Paneli",     href: "http://localhost/jury/dashboard" },
            ].map((l) => (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-[#212121] text-white text-sm font-medium rounded-lg hover:bg-[#fab758] hover:text-[#212121] transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

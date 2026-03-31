import Image from "next/image"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header — logo container genişliğiyle hizalı */}
      <header className="w-full border-b border-border">
        <div className="mx-auto w-full max-w-[420px] px-6 py-4">
          <Image src="/logo.png" alt="Divizyon" width={150} height={38} priority />
        </div>
      </header>

      {/* Body — header ile aynı max-w */}
      <main className="flex-1 flex flex-col justify-center">
        <div className="mx-auto w-full max-w-[420px] px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}

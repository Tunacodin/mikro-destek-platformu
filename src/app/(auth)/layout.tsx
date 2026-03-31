import Image from "next/image"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center">
      <main className="flex-1 flex flex-col justify-center">
        <div className="mx-auto w-full max-w-[420px] px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}

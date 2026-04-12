export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[390px]">
        {children}
      </div>
    </div>
  )
}

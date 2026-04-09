"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"

type Status = "validating" | "signing-in" | "success" | "error"

export function MagicLinkHandler() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")

  const [status, setStatus] = useState<Status>("validating")
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setErrorMsg("Geçersiz bağlantı. Token bulunamadı.")
      return
    }

    async function handle() {
      try {
        // 1. Token'ı doğrula ve kullanıcıyı oluştur/bul
        const res = await fetch(`/api/auth/magic-link/validate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        })

        const data = await res.json()

        if (!res.ok) {
          setStatus("error")
          setErrorMsg(data.error ?? "Bağlantı doğrulanamadı.")
          return
        }

        // 2. Magic link credentials ile giriş yap
        setStatus("signing-in")
        const result = await signIn("credentials", {
          email: data.email,
          password: "",
          magicToken: token,
          redirect: false,
        })

        if (!result || result.error) {
          setStatus("error")
          setErrorMsg("Giriş yapılamadı. Lütfen tekrar deneyin.")
          return
        }

        setStatus("success")
        setTimeout(() => { window.location.href = "/onboarding" }, 1500)
      } catch {
        setStatus("error")
        setErrorMsg("Beklenmedik bir hata oluştu.")
      }
    }

    handle()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  return (
    <div className="bg-white border rounded-lg p-8 shadow-sm text-center space-y-4">
      {status === "validating" && (
        <>
          <Loader2 className="w-10 h-10 animate-spin text-slate-400 mx-auto" />
          <p className="text-sm text-muted-foreground">Davet bağlantısı doğrulanıyor…</p>
        </>
      )}

      {status === "signing-in" && (
        <>
          <Loader2 className="w-10 h-10 animate-spin text-slate-400 mx-auto" />
          <p className="text-sm text-muted-foreground">Giriş yapılıyor…</p>
        </>
      )}

      {status === "success" && (
        <>
          <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
          <div>
            <p className="font-medium">Giriş başarılı!</p>
            <p className="text-sm text-muted-foreground mt-1">Jüri paneline yönlendiriliyorsunuz…</p>
          </div>
        </>
      )}

      {status === "error" && (
        <>
          <XCircle className="w-10 h-10 text-red-500 mx-auto" />
          <div>
            <p className="font-medium text-red-600">Giriş yapılamadı</p>
            <p className="text-sm text-muted-foreground mt-1">{errorMsg}</p>
          </div>
          <a
            href="/login"
            className="inline-block text-sm text-slate-900 underline underline-offset-2 hover:no-underline"
          >
            Giriş sayfasına dön
          </a>
        </>
      )}
    </div>
  )
}

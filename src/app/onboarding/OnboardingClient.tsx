"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { completeOnboarding } from "./actions"
import type { Role } from "@prisma/client"
import {
  CheckCircle2,
  ChevronRight,
  FileText,
  Users,
  ClipboardList,
  Trophy,
  LayoutDashboard,
  Upload,
  Star,
  FolderKanban,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react"

const ROLE_HOME: Record<Role, string> = {
  ADMIN:     "/admin/dashboard",
  APPLICANT: "/dashboard",
  JURY:      "/jury/dashboard",
}

const STEPS: Record<Role, { icon: React.ElementType; title: string; desc: string }[]> = {
  ADMIN: [
    {
      icon: LayoutDashboard,
      title: "Yönetim Panelinize Hoş Geldiniz",
      desc: "Program yöneticisi olarak başvuru dönemlerini açar, jüri üyelerini atar ve destek kararlarını verirsiniz.",
    },
    {
      icon: FileText,
      title: "Başvuru Dönemleri",
      desc: "Dönem başlatın, tarihleri belirleyin ve başvuru sürecini yönetin. Dönem kapandığında başvurular otomatik kilitlenir.",
    },
    {
      icon: Users,
      title: "Jüri Atama",
      desc: "Jüri üyelerini e-posta davet bağlantısıyla davet edin. Üyeler ayrı hesap oluşturmadan sisteme giriş yapar.",
    },
    {
      icon: Trophy,
      title: "Destek Kararı ve Proje Takip",
      desc: "Değerlendirilen başvuruları inceleyin ve destek kararını verin. Kabul edilen projeler proje takip panelinde izlenir.",
    },
  ],
  APPLICANT: [
    {
      icon: LayoutDashboard,
      title: "Başvuru Panelinize Hoş Geldiniz",
      desc: "Bu panel üzerinden destek programına başvurabilir, başvurunuzun durumunu takip edebilirsiniz.",
    },
    {
      icon: FileText,
      title: "Başvuru Oluşturma",
      desc: "Aktif dönemde başvurunuzu oluşturun. Taslak olarak kaydedip daha sonra tamamlayabilirsiniz.",
    },
    {
      icon: Upload,
      title: "Dosya Yükleme",
      desc: "Proje planı, bütçe tablosu ve destekleyici belgelerinizi başvurunuza ekleyin.",
    },
    {
      icon: FolderKanban,
      title: "Proje Takip",
      desc: "Destek aldığınızda projeniz takip paneline taşınır. Dönemsel güncelleme notlarınızı buradan gönderirsiniz.",
    },
  ],
  JURY: [
    {
      icon: LayoutDashboard,
      title: "Jüri Panelinize Hoş Geldiniz",
      desc: "Jüri üyesi olarak size atanan başvuruları değerlendirirsiniz. Yalnızca atandığınız başvuruları görebilirsiniz.",
    },
    {
      icon: ClipboardList,
      title: "Değerlendirme Ekranı",
      desc: "Sol panelde başvuru dosyaları, sağ panelde puanlama cetveli bulunur. Bölünmüş ekran görünümü odaklanmanızı sağlar.",
    },
    {
      icon: Star,
      title: "Kriter Bazlı Puanlama",
      desc: "Her kriter için 1-5 arası puan verin ve gerekçenizi yazın. Gerekçesiz form gönderilemez.",
    },
    {
      icon: FileText,
      title: "Dosya Notları",
      desc: "Başvuru dosyalarına değerlendirici notları ekleyebilirsiniz. Notlar yalnızca jüri ve admin tarafından görülür.",
    },
  ],
}

const inputCls = "w-full px-3.5 py-2.5 bg-[#f5f5f5] border border-transparent rounded-xl text-[14px] text-[#1c1c1c] placeholder:text-[#c7c7cc] focus:outline-none focus:ring-2 focus:ring-[#fab758]/50 focus:bg-white focus:border-[#fab758]/30 transition-all"

export function OnboardingClient({
  role,
  name,
  needsPassword,
}: {
  role: Role
  name: string
  needsPassword: boolean
}) {
  const steps = STEPS[role]
  const totalSteps = steps.length + (needsPassword ? 1 : 0)
  const passwordStepIndex = steps.length // password step is after role steps

  const [current, setCurrent] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [pwError, setPwError] = useState("")
  const { update } = useSession()

  const isPasswordStep = needsPassword && current === passwordStepIndex
  const isLast = current === totalSteps - 1

  async function handleNext() {
    if (submitting) return

    // Password step validation
    if (isPasswordStep) {
      if (password.length < 6) {
        setPwError("Şifre en az 6 karakter olmalı.")
        return
      }
      if (password !== passwordConfirm) {
        setPwError("Şifreler eşleşmiyor.")
        return
      }
      setPwError("")

      if (!isLast) {
        setCurrent((c) => c + 1)
        return
      }

      // Last step: save password + complete onboarding
      setSubmitting(true)
      try {
        const pwRes = await fetch("/api/user/password", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        })
        if (!pwRes.ok) {
          const data = await pwRes.json().catch(() => ({}))
          setPwError(data.error ?? "Şifre kaydedilemedi. Lütfen tekrar deneyin.")
          return
        }
        await completeOnboarding()
        await update({ onboardingCompleted: true })
        window.location.href = ROLE_HOME[role]
      } finally {
        setSubmitting(false)
      }
      return
    }

    // Regular step navigation
    if (!isLast) {
      setCurrent((c) => c + 1)
      return
    }

    // Last step (no password needed)
    setSubmitting(true)
    try {
      await completeOnboarding()
      await update({ onboardingCompleted: true })
      window.location.href = ROLE_HOME[role]
    } finally {
      setSubmitting(false)
    }
  }

  // Current step content
  const step = !isPasswordStep ? steps[current] : null
  const Icon = step?.icon ?? Lock

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-black/[0.04] p-8 space-y-7">
        {/* Başlık */}
        <div className="text-center space-y-1">
          <p className="text-[12px] text-[#aeaeb2] font-medium">Hoş geldiniz, {name}</p>
          <h1 className="text-[18px] font-bold text-[#1c1c1c] tracking-tight">Mikro Destek Fonu Platformu</h1>
        </div>

        {/* İkon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-[#fab758]/10 flex items-center justify-center">
            <Icon className="w-8 h-8 text-[#fab758]" />
          </div>
        </div>

        {/* İçerik */}
        {isPasswordStep ? (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <h2 className="text-[16px] font-semibold text-[#1c1c1c]">Şifrenizi Belirleyin</h2>
              <p className="text-[13px] text-[#6e6e73] leading-relaxed">
                Bir sonraki girişinizde e-posta ve şifrenizle giriş yapabilirsiniz.
              </p>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="Şifre (en az 6 karakter)"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setPwError("") }}
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aeaeb2] hover:text-[#6e6e73] cursor-pointer"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <input
                type={showPw ? "text" : "password"}
                placeholder="Şifre tekrar"
                value={passwordConfirm}
                onChange={(e) => { setPasswordConfirm(e.target.value); setPwError("") }}
                className={inputCls}
              />
              {pwError && (
                <p className="text-[12px] text-red-500">{pwError}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center space-y-2.5">
            <h2 className="text-[16px] font-semibold text-[#1c1c1c]">{step!.title}</h2>
            <p className="text-[13px] text-[#6e6e73] leading-relaxed">{step!.desc}</p>
          </div>
        )}

        {/* İlerleme noktaları */}
        <div className="flex justify-center items-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current
                  ? "w-6 bg-[#fab758]"
                  : i < current
                  ? "w-1.5 bg-[#fab758]/40"
                  : "w-1.5 bg-[#e5e5e5]"
              }`}
            />
          ))}
        </div>

        {/* Buton */}
        <button
          onClick={handleNext}
          disabled={submitting || (isPasswordStep && !password)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#212121] text-white text-[14px] font-semibold rounded-xl shadow-sm hover:bg-[#383838] hover:shadow disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {submitting ? (
            "Yükleniyor…"
          ) : isLast ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Başlayalım
            </>
          ) : (
            <>
              İleri
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      <p className="text-center text-[11px] text-[#aeaeb2] mt-3">
        {current + 1} / {totalSteps}
      </p>
    </div>
  )
}

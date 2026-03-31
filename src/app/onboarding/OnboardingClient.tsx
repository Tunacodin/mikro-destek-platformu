"use client"

import { useState, useTransition } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
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
} from "lucide-react"

const ROLE_HOME: Record<Role, string> = {
  ADMIN: "/admin/dashboard",
  APPLICANT: "/dashboard",
  JURY: "/jury/dashboard",
}

// Rol bazlı onboarding adımları
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
      desc: "Destek aldığınızda projeniz takip paneline taşınır. Dönemsel ilerleme raporlarınızı buradan gönderirsiniz.",
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

export function OnboardingClient({ role, name }: { role: Role; name: string }) {
  const steps = STEPS[role]
  const [current, setCurrent] = useState(0)
  const [isPending, startTransition] = useTransition()
  const { update } = useSession()
  const router = useRouter()

  const isLast = current === steps.length - 1

  function handleNext() {
    if (!isLast) {
      setCurrent((c) => c + 1)
      return
    }

    startTransition(async () => {
      // 1. DB'yi güncelle
      await completeOnboarding()
      // 2. JWT token'ı yenile
      await update({ onboardingCompleted: true })
      // 3. Role dashboard'una yönlendir
      router.push(ROLE_HOME[role])
    })
  }

  const step = steps[current]
  const Icon = step.icon

  return (
    <div className="w-full max-w-lg">
      {/* Kart */}
      <div className="bg-white rounded-2xl shadow-sm border p-8 space-y-6">
        {/* Başlık */}
        <div className="text-center space-y-1">
          <p className="text-sm text-muted-foreground">Hoş geldiniz, {name}</p>
          <h1 className="text-xl font-bold">Mikro Destek Fonu Platformu</h1>
        </div>

        {/* Adım İkonu */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
            <Icon className="w-8 h-8 text-slate-700" />
          </div>
        </div>

        {/* Adım İçeriği */}
        <div className="text-center space-y-2">
          <h2 className="text-lg font-semibold">{step.title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
        </div>

        {/* İlerleme noktaları */}
        <div className="flex justify-center gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === current
                  ? "w-6 bg-slate-900"
                  : i < current
                  ? "w-1.5 bg-slate-400"
                  : "w-1.5 bg-slate-200"
              }`}
            />
          ))}
        </div>

        {/* Buton */}
        <button
          onClick={handleNext}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? (
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

      {/* Adım sayacı */}
      <p className="text-center text-xs text-muted-foreground mt-3">
        {current + 1} / {steps.length}
      </p>
    </div>
  )
}

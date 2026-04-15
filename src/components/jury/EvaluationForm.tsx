"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, ChevronUp, Info } from "lucide-react"

// ── Değerlendirme formundaki 7 ana kriter + 1 bonus ─────────────────────────

type Criterion = {
  key: string
  label: string
  description: string
  subQuestions: string[]
  scoreLabels: Record<number, string>
  isBonus?: boolean
}

const CRITERIA: Criterion[] = [
  {
    key: "innovation",
    label: "Yenilikçilik ve Özgünlük",
    description: "Başvurunun, mevcut yöntem ve üretimlerden ayrışan, yeni bir yaklaşım veya değer sunma kapasitesini ifade eder. Proje veya eserin özgün niteliği, yaratıcı katkısı ve alanındaki farklılaştırıcı yönleri bu kapsamda değerlendirilir.",
    subQuestions: [
      "Fikir veya proje konusu, alanda yeni bir yaklaşım sunuyor mu?",
      "Bilinen yöntemlerden, eserlerden veya ürünlerden anlamlı şekilde farklılaşıyor mu?",
      "Yaratıcı, estetik veya teknik açıdan ilham verici bir yön barındırıyor mu?",
      "Alanında doldurulmamış bir boşluğu gideriyor mu?",
      "Deneysel, öncü veya cesur bir katkı sunuyor mu?",
      "Sektörel trendlerle ilişkisi güçlü mü, yoksa kalıcı bir özgünlük mü barındırıyor?",
      "İzleyici/kullanıcı üzerinde farklı bir deneyim yaratma potansiyeli var mı?",
    ],
    scoreLabels: {
      1: "Kopya / Tekrarlayan",
      2: "Kısmen Yeni / Zayıf Farklılık",
      3: "Orta Derecede Özgün / Alışılagelmiş Yenilik",
      4: "Belirgin Özgün / Yenilikçi Katkı",
      5: "Çok Yüksek Özgünlük / Öncü & Deneysel",
    },
  },
  {
    key: "feasibility",
    label: "Uygulanabilirlik ve Olgunluk",
    description: "Başvurunun tanımının açıklığı, teknik veya sanatsal açıdan hayata geçirilebilirliği ve proje planının bütünlüğü esas alınır. Ekip yeterliliği, zaman yönetimi ve kaynakların uygun biçimde planlanması da bu ölçüt kapsamında incelenir.",
    subQuestions: [
      "Proje tanımı net, anlaşılır ve uygulanabilir mi?",
      "Teknik, sanatsal veya metodolojik açıdan hayata geçirilebilir mi?",
      "Yol haritası ve aşamalar planlanmış mı?",
      "Projenin geliştirilmesi için ekip yeterliliği uygun mu?",
      "Kaynak, zaman ve iş gücü gerçekçi planlanmış mı?",
      "Prototip, demo, maket veya kavramsal eskiz mevcut mu?",
      "Orta vadede ölçeklenme veya yeni sürümlere evrilme potansiyeli var mı?",
    ],
    scoreLabels: {
      1: "Belirsiz / Yapılamaz",
      2: "Zayıf Plan / Riskli",
      3: "Orta Seviye / Kısmen Hazır",
      4: "Uygulanabilir / Güçlü Plan",
      5: "Çok Yüksek Uygulanabilirlik / Olgun Proje",
    },
  },
  {
    key: "community",
    label: "Topluluk Katkısı",
    description: "Projenin Divizyon topluluğuna sağlayacağı fayda, paylaşılabilirlik derecesi ve ortak üretim imkânı yaratma kapasitesi değerlendirilir. Öğrenme, mentorluk ve topluluk kültürüne uyum bu başlık altında dikkate alınır.",
    subQuestions: [
      "Proje çıktıları topluluk içinde paylaşılabilir mi?",
      "Ortak üretim veya disiplinlerarası işbirliği fırsatı yaratıyor mu?",
      "Öğrenme, mentorluk veya bilgi aktarımı için fırsatlar sunuyor mu?",
      "Topluluk üyelerinin ilgisini çekebilecek mi?",
      "Divizyon kültürü ve değerleriyle uyumlu mu?",
      "Ekosistem içi görünürlük ve rol-model olma potansiyeli var mı?",
      "Katılımcıların motivasyonunu ve aidiyet duygusunu artırıyor mu?",
    ],
    scoreLabels: {
      1: "Katkısız / İzole",
      2: "Sınırlı Katkı / Zayıf Uyum",
      3: "Orta Katkı / Paylaşılabilir",
      4: "Yüksek Katkı / Toplulukla Uyumlu",
      5: "Çok Yüksek Katkı / Kolektif Fayda ve İlham",
    },
  },
  {
    key: "ecosystem",
    label: "Ekosistem ve Toplumsal Etki",
    description: "Başvurunun yerel, ulusal ve uluslararası ölçekte yaratabileceği katkılar ile sosyal fayda ve sürdürülebilirlik boyutu esas alınır. Kültürel, akademik veya sektörel düzeyde sağlanacak ekosistem katkısı bu ölçüt kapsamında değerlendirilir.",
    subQuestions: [
      "Yerel ekosisteme anlamlı bir katkı sağlıyor mu?",
      "Ulusal veya uluslararası düzeyde bağlantı kurma potansiyeli var mı?",
      "Sosyal fayda ve sürdürülebilirlik perspektifi içeriyor mu?",
      "Kültürel, sanatsal veya akademik değer yaratıyor mu?",
      "Projenin ölçülebilir ve görünür bir etkisi olacak mı?",
      "Endüstri veya yaratıcı sektörler için ilham verici bir model sunuyor mu?",
      "Toplumsal kapsayıcılığı ve çeşitliliği destekliyor mu?",
    ],
    scoreLabels: {
      1: "Etkisiz / Önemsiz",
      2: "Sınırlı Etki / Dar Kapsam",
      3: "Orta Etki / Yerel Katkı",
      4: "Yüksek Etki / Ulusal Katkı",
      5: "Çok Yüksek Etki / Uluslararası & Sürdürülebilir",
    },
  },
  {
    key: "resource",
    label: "Kaynak Uygunluğu ve Verimlilik",
    description: "Talep edilen destek kalemlerinin gerçekçi, amaca uygun ve ölçülü olup olmadığı dikkate alınır. Kaynakların verimli kullanımı, alternatif çözüm yolları ve sınırlı imkânlarla yüksek etki üretme potansiyeli bu ölçüt kapsamında incelenir.",
    subQuestions: [
      "Belirtilen ihtiyaçlar gerçekçi ve ölçülü mü?",
      "Talep edilen destek kalemleri projeye doğrudan uygun mu?",
      "Kaynak israfı riski barındırıyor mu?",
      "Alternatif çözüm yolları düşünülmüş mü?",
      "Sağlanan az bir destekle yüksek etki üretilebilir mi?",
      "Proje kaynakları etkin bir şekilde yönetebilecek mi?",
      "Sürdürülebilir bir kullanım planı var mı?",
    ],
    scoreLabels: {
      1: "Uygunsuz / İsraf Riski",
      2: "Zayıf Uyum / Fazla Kaynak Talebi",
      3: "Orta Uyum / Kısmen Gerçekçi",
      4: "Yüksek Uyum / Verimli Kullanım",
      5: "Çok Yüksek Uyum / Az Kaynakla Büyük Etki",
    },
  },
  {
    key: "output",
    label: "Çıktı ve Sonuç Potansiyeli",
    description: "Projenin kısa vadede somut bir ürün, eser, hizmet veya deneyim çıktısı üretebilme kapasitesi değerlendirilir. Zamanında tamamlanma, işbirliği fırsatları ve uzun vadede ekosistem içinde kalıcı değer bırakma potansiyeli bu başlık altında incelenir.",
    subQuestions: [
      "Somut ürün, eser, içerik veya deneyim çıktısı yaratacak mı?",
      "Üretilen çıktı kullanıcı/izleyici tarafından test edilebilir mi?",
      "İşbirliği, spin-off veya yeni üretimlere zemin hazırlıyor mu?",
      "Planlanan takvimde tamamlanabilir mi?",
      "Çıktıların orta vadede büyütülme veya uyarlanma potansiyeli var mı?",
      "Uzun vadede Divizyon ekosisteminde kalıcı bir değer bırakabilir mi?",
      "Katma değeri ölçülebilir ve raporlanabilir mi?",
    ],
    scoreLabels: {
      1: "Belirsiz Çıktı / Zayıf Potansiyel",
      2: "Sınırlı Çıktı / Düşük Etki",
      3: "Orta Çıktı / Makul Potansiyel",
      4: "Yüksek Çıktı / Somut Katkı",
      5: "Çok Yüksek Çıktı / Kalıcı Etki",
    },
  },
  {
    key: "visibility",
    label: "Görünürlük ve İtibar Katkısı",
    description: "Başvurunun Divizyon'un kurumsal itibarı, tanınırlığı ve görünürlüğüne sağlayacağı katkılar esas alınır. Projenin vitrinlenebilirliği, medya ve paydaş değerine katkısı ile Divizyon'un marka algısını güçlendirme potansiyeli bu ölçüt kapsamında değerlendirilir.",
    subQuestions: [
      "Proje Divizyon'un prestijini güçlendiriyor mu?",
      "Dış paydaşlar nezdinde vitrinlenebilir mi?",
      "PR ve medya değeri üretebilir mi?",
      "Divizyon'un marka algısını olumlu yönde etkiler mi?",
      "Kültürel/teknolojik trendlerle ilişkilendirilerek öne çıkarılabilir mi?",
      "Bölgesel veya uluslararası platformlarda temsil edilebilir mi?",
      "Topluluk içi motivasyon ve aidiyet için bir başarı hikâyesine dönüşebilir mi?",
    ],
    scoreLabels: {
      1: "Etkisiz / Görünmez",
      2: "Zayıf Görünürlük / Düşük Prestij",
      3: "Orta Görünürlük / Kısmi Prestij",
      4: "Yüksek Görünürlük / Güçlü Prestij",
      5: "Çok Yüksek Görünürlük / Stratejik Vitrin",
    },
  },
  {
    key: "bonus",
    label: "Bonus: Motivasyon, Sunum ve Anlatım Performansı",
    description: "Başvurunun sunum kalitesi, anlatım tutarlılığı ve motivasyon düzeyi değerlendirilir. Bu kriter toplam puana ek olarak eklenir.",
    subQuestions: [
      "Başvurunun genel anlatımı tutarlı ve ikna edici mi?",
      "Motivasyon ve tutku hissediliyor mu?",
      "Sunum materyalleri kaliteli mi?",
    ],
    scoreLabels: {
      1: "Zayıf",
      2: "Orta Altı",
      3: "Orta",
      4: "İyi",
      5: "Çok İyi",
    },
    isBonus: true,
  },
]

const MAIN_CRITERIA = CRITERIA.filter((c) => !c.isBonus)
const BONUS_CRITERIA = CRITERIA.filter((c) => c.isBonus)

// Puan aralıkları (max 35 ana + 5 bonus = 40, ama bandlar ana 35 üzerinden)
const SCORE_BANDS = [
  { max: 23, label: "Desteklenemez",        bar: "bg-red-400",     text: "text-red-600",     bg: "bg-red-50" },
  { max: 27, label: "Sınırlı Destek",       bar: "bg-orange-400",  text: "text-orange-600",  bg: "bg-orange-50" },
  { max: 31, label: "Genişletilmiş Destek", bar: "bg-[#fab758]",   text: "text-amber-600",   bg: "bg-amber-50" },
  { max: 36, label: "Öncelikli Destek",     bar: "bg-emerald-400", text: "text-emerald-600", bg: "bg-emerald-50" },
]

function getBand(total: number) {
  return SCORE_BANDS.find((b) => total < b.max) ?? SCORE_BANDS[3]
}

// ── Types ────────────────────────────────────────────────────────────────────

type ExistingScore = { id: string; criteria: string; score: number; justification: string }
type ExistingEvaluation = {
  id: string
  comment: string | null
  scores: ExistingScore[]
} | null

type ScoreEntry = { score: number; justification: string }

// ── Component ────────────────────────────────────────────────────────────────

export function EvaluationForm({
  applicationId,
  canEvaluate,
  existingEvaluation,
}: {
  applicationId: string
  canEvaluate: boolean
  existingEvaluation: ExistingEvaluation
}) {
  const router = useRouter()
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { threshold: 0 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  const initScores = (): Record<string, ScoreEntry> => {
    const base: Record<string, ScoreEntry> = {}
    for (const c of CRITERIA) {
      const ex = existingEvaluation?.scores.find((s) => s.criteria === c.key)
      base[c.key] = { score: ex?.score ?? 0, justification: ex?.justification ?? "" }
    }
    return base
  }

  const [scores, setScores] = useState<Record<string, ScoreEntry>>(initScores)
  const [comment, setComment] = useState(existingEvaluation?.comment ?? "")
  const [submitting, setSubmitting] = useState(false)
  const [draftSaving, setDraftSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [draftSuccess, setDraftSuccess] = useState(false)
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null)
  // Açık/kapalı kriter takibi — sadece aktif kriter açık, tamamlananlar compact
  const [expandedCriteria, setExpandedCriteria] = useState<Set<string>>(() => {
    // İlk yüklemede yalnızca ilk doldurulmamış kriteri açık başlat
    const firstIncomplete = CRITERIA.find((c) => {
      const ex = existingEvaluation?.scores.find((s) => s.criteria === c.key)
      return !ex || !ex.score || ex.justification.trim().length < 10
    })
    return firstIncomplete ? new Set([firstIncomplete.key]) : new Set()
  })

  // Hesaplamalar
  const mainTotal = MAIN_CRITERIA.reduce((s, c) => s + (scores[c.key].score || 0), 0)
  const bonusTotal = BONUS_CRITERIA.reduce((s, c) => s + (scores[c.key].score || 0), 0)
  const grandTotal = mainTotal + bonusTotal
  const mainFilled = MAIN_CRITERIA.filter((c) => scores[c.key].score > 0).length
  const allMainFilled = MAIN_CRITERIA.every((c) => scores[c.key].score > 0 && scores[c.key].justification.trim().length >= 10)
  const band = mainFilled > 0 ? getBand(mainTotal) : null

  function isCriterionExpanded(key: string) {
    return expandedCriteria.has(key)
  }

  function toggleCriterionExpanded(key: string) {
    setExpandedCriteria((prev) => {
      if (prev.has(key)) {
        // Zaten açıksa kapat
        const next = new Set(prev)
        next.delete(key)
        return next
      }
      // Başka birine tıklandıysa diğerlerini kapat, sadece bunu aç
      return new Set([key])
    })
  }

  function updateScore(key: string, field: keyof ScoreEntry, value: string | number) {
    setScores((prev) => {
      const next = { ...prev, [key]: { ...prev[key], [field]: value } }
      return next
    })
    setSuccess(false)
  }

  async function submit() {
    if (!allMainFilled) return
    setSubmitting(true)
    setError(null)
    setDraftSuccess(false)

    const payload = {
      applicationId,
      comment: comment.trim() || undefined,
      scores: CRITERIA.filter((c) => scores[c.key].score > 0).map((c) => ({
        criteria: c.key,
        score: scores[c.key].score,
        justification: scores[c.key].justification.trim(),
      })),
    }

    const res = await fetch("/api/jury/evaluations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? "Bir hata oluştu.")
    } else {
      setSuccess(true)
      router.refresh()
    }
    setSubmitting(false)
  }

  async function saveDraft() {
    const completedScores = CRITERIA.filter(
      (c) => scores[c.key].score > 0 && scores[c.key].justification.trim().length >= 10
    )
    if (completedScores.length === 0) {
      setError("Taslak kaydedebilmek için en az bir kriteri puanlayın ve gerekçe yazın.")
      return
    }
    setDraftSaving(true)
    setError(null)
    setSuccess(false)

    const payload = {
      applicationId,
      comment: comment.trim() || undefined,
      scores: completedScores.map((c) => ({
        criteria: c.key,
        score: scores[c.key].score,
        justification: scores[c.key].justification.trim(),
      })),
    }

    const res = await fetch("/api/jury/evaluations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? "Bir hata oluştu.")
    } else {
      setDraftSuccess(true)
      router.refresh()
    }
    setDraftSaving(false)
  }

  return (
    <div className="space-y-6">

      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[14px] font-semibold text-[#1c1c1c]">Değerlendirme Formu</p>
          <p className="text-[12px] text-[#aeaeb2] mt-0.5">7 ana kriter + 1 bonus · Maks. 35+5 puan</p>
        </div>
        {existingEvaluation && (
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${canEvaluate ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-500"}`}>
            {canEvaluate ? "Düzenleniyor" : "Kilitli"}
          </span>
        )}
      </div>

      {/* Sentinel — sticky'nin ne zaman sıkışacağını takip eder */}
      <div ref={sentinelRef} className="h-px -mt-2" aria-hidden />

      {/* Anlık Toplam — scroll'a göre compact'a geçer */}
      {band && (
        <div className="sticky top-0 z-10 -mx-1 px-1 pb-1 bg-white">
          <div
            className={`${band.bg} rounded-xl overflow-hidden transition-all duration-300 ease-in-out ${
              scrolled ? "px-4 py-2" : "px-4 py-3.5"
            }`}
          >
            {/* Her zaman görünen satır */}
            <div className="flex items-center justify-between">
              <span className={`font-semibold transition-all duration-300 ${scrolled ? "text-[12px]" : "text-[13px]"} ${band.text}`}>
                {band.label}
              </span>
              <div className="flex items-center gap-1.5">
                {scrolled && bonusTotal > 0 && (
                  <span className="text-[11px] text-[#aeaeb2]">+{bonusTotal}</span>
                )}
                <span className={`font-bold text-[#1c1c1c] tabular-nums transition-all duration-300 ${scrolled ? "text-[15px]" : "text-[18px]"}`}>
                  {mainTotal}
                </span>
                <span className={`text-[#6e6e73] transition-all duration-300 ${scrolled ? "text-[11px]" : "text-[12px]"}`}>/35</span>
                {!scrolled && bonusTotal > 0 && (
                  <span className="text-[12px] text-[#aeaeb2] ml-1">(+{bonusTotal} bonus)</span>
                )}
              </div>
            </div>

            {/* Progress bar — sadece geniş halde */}
            <div
              className={`overflow-hidden transition-all duration-300 ${scrolled ? "max-h-0 mt-0" : "max-h-10 mt-2"}`}
            >
              <div className="h-2 bg-black/[0.07] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${band.bar}`}
                  style={{ width: `${Math.min(100, (mainTotal / 35) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-1.5 text-[10px] text-[#aeaeb2]">
                <span>{mainFilled}/7 kriter puanlandı</span>
                <span>Toplam: {grandTotal}/40</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ana Kriterler */}
      <div className="space-y-2">
        {MAIN_CRITERIA.map((criterion, idx) => (
          <CriterionBlock
            key={criterion.key}
            criterion={criterion}
            index={idx + 1}
            entry={scores[criterion.key]}
            canEvaluate={canEvaluate}
            isExpanded={isCriterionExpanded(criterion.key)}
            isGuideOpen={expandedGuide === criterion.key}
            onToggle={() => toggleCriterionExpanded(criterion.key)}
            onToggleGuide={() => setExpandedGuide(expandedGuide === criterion.key ? null : criterion.key)}
            onUpdate={(field, value) => updateScore(criterion.key, field, value)}
          />
        ))}
      </div>

      {/* Bonus */}
      <div className="pt-4 border-t border-black/[0.06]">
        <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-wider mb-3">Bonus Kriter</p>
        {BONUS_CRITERIA.map((criterion) => (
          <CriterionBlock
            key={criterion.key}
            criterion={criterion}
            entry={scores[criterion.key]}
            canEvaluate={canEvaluate}
            isExpanded={isCriterionExpanded(criterion.key)}
            isGuideOpen={expandedGuide === criterion.key}
            onToggle={() => toggleCriterionExpanded(criterion.key)}
            onToggleGuide={() => setExpandedGuide(expandedGuide === criterion.key ? null : criterion.key)}
            onUpdate={(field, value) => updateScore(criterion.key, field, value)}
          />
        ))}
      </div>

      {/* Yöneticiye Geri Bildirim / Görüş ve Öneriler */}
      <div className="pt-4 border-t border-black/[0.06] space-y-1.5">
        <label className="text-[12px] font-medium text-[#6e6e73] flex items-center gap-1.5">
          Geri Bildirim / Görüş ve Öneriler
          <span className="font-normal text-[10px] bg-[#f0f0f0] text-[#aeaeb2] px-2 py-0.5 rounded-full">Sadece Yönetici Görecek</span>
        </label>
        <textarea
          disabled={!canEvaluate}
          value={comment}
          onChange={(e) => { setComment(e.target.value); setSuccess(false) }}
          placeholder="Program yöneticisine iletmek istediğiniz görüş, öneri veya notlar…"
          rows={3}
          className="w-full px-3 py-2.5 bg-[#f5f5f5] border-0 rounded-xl text-[13px] text-[#1c1c1c] placeholder:text-[#aeaeb2] resize-none focus:outline-none focus:ring-1 focus:ring-[#fab758]/40 focus:bg-white transition-all disabled:opacity-50"
        />
      </div>

      {/* Hata / Başarı */}
      {error && (
        <div className="bg-red-50 rounded-xl px-4 py-2.5">
          <p className="text-[13px] text-red-600">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 rounded-xl px-4 py-2.5">
          <p className="text-[13px] text-emerald-700">Değerlendirme kaydedildi.</p>
        </div>
      )}
      {draftSuccess && (
        <div className="bg-amber-50 rounded-xl px-4 py-2.5">
          <p className="text-[13px] text-amber-700">Taslak kaydedildi.</p>
        </div>
      )}

      {/* Gönder + Taslak */}
      {canEvaluate && (
        <div className="space-y-2">
          {!allMainFilled && (
            <p className="text-[11px] text-[#aeaeb2] text-center">
              Tüm ana kriterleri puanlayın ve gerekçe yazın (en az 10 karakter).
            </p>
          )}
          <button
            onClick={submit}
            disabled={!allMainFilled || submitting}
            className="w-full py-3 bg-[#1c1c1c] text-white text-[13px] font-semibold rounded-xl shadow-sm hover:bg-[#383838] hover:shadow disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {submitting ? "Kaydediliyor…" : existingEvaluation ? "Değerlendirmeyi Güncelle" : "Değerlendirmeyi Gönder"}
          </button>
          <button
            onClick={saveDraft}
            disabled={draftSaving || submitting}
            className="w-full py-2.5 bg-white border border-black/[0.1] text-[#6e6e73] text-[13px] font-medium rounded-xl hover:bg-[#f9f9f9] hover:border-black/[0.15] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {draftSaving ? "Kaydediliyor…" : "Taslak Olarak Kaydet"}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Kriter Bloğu ─────────────────────────────────────────────────────────────

function CriterionBlock({
  criterion,
  index,
  entry,
  canEvaluate,
  isExpanded,
  isGuideOpen,
  onToggle,
  onToggleGuide,
  onUpdate,
}: {
  criterion: Criterion
  index?: number
  entry: ScoreEntry
  canEvaluate: boolean
  isExpanded: boolean
  isGuideOpen: boolean
  onToggle: () => void
  onToggleGuide: () => void
  onUpdate: (field: keyof ScoreEntry, value: string | number) => void
}) {
  const hasScore = entry.score > 0
  const hasJustification = entry.justification.trim().length >= 10
  const isComplete = hasScore && hasJustification
  const justTooShort = !hasJustification && entry.justification.length > 0
  const scoreLabel = hasScore ? criterion.scoreLabels[entry.score] : null

  // ── Kapalı (compact) görünüm — tüm kapalı kriterler ──────────────────────
  if (!isExpanded) {
    return (
      <div
        onClick={onToggle}
        className={`rounded-xl border px-3 py-2 flex items-center gap-2 cursor-pointer transition-all group ${
          isComplete
            ? "border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50/60"
            : "border-black/[0.06] bg-white hover:bg-[#f9f9f9]"
        }`}
      >
        {index !== undefined && (
          <span className={`text-[10px] font-bold w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
            isComplete ? "text-emerald-600 bg-emerald-100" : "text-[#aeaeb2] bg-[#f0f0f0]"
          }`}>
            {index}
          </span>
        )}
        <p className="text-[12px] font-medium text-[#1c1c1c] flex-1 truncate min-w-0">{criterion.label}</p>
        {hasScore ? (
          <span className="text-[11px] font-semibold bg-[#1c1c1c] text-white px-2 py-0.5 rounded-md tabular-nums shrink-0">
            {entry.score}/5
          </span>
        ) : (
          <span className="text-[11px] text-[#d1d1d6] shrink-0">—</span>
        )}
        <ChevronDown className="w-3 h-3 text-[#aeaeb2] shrink-0 group-hover:text-[#6e6e73] transition-colors" />
      </div>
    )
  }

  // ── Açık (expanded) görünüm ───────────────────────────────────────────────
  return (
    <div className={`rounded-xl border transition-all ${
      isComplete
        ? "border-emerald-200 bg-emerald-50/20"
        : "border-black/[0.06] bg-white"
    }`}>
      {/* Header */}
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <button
            onClick={onToggle}
            className="flex items-start gap-2.5 min-w-0 text-left cursor-pointer flex-1"
          >
            {index && (
              <span className={`text-[11px] font-bold w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                isComplete ? "text-emerald-600 bg-emerald-100" : "text-[#aeaeb2] bg-[#f0f0f0]"
              }`}>
                {index}
              </span>
            )}
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-[#1c1c1c]">{criterion.label}</p>
              {scoreLabel && (
                <p className="text-[11px] text-[#6e6e73] mt-0.5">{entry.score}/5 — {scoreLabel}</p>
              )}
            </div>
          </button>
          <div className="flex items-center gap-1 shrink-0">
            {isComplete && (
              <ChevronUp
                onClick={onToggle}
                className="w-3.5 h-3.5 text-[#aeaeb2] hover:text-[#6e6e73] transition-colors cursor-pointer"
              />
            )}
            <button
              onClick={onToggleGuide}
              className="inline-flex items-center gap-1 text-[11px] text-[#aeaeb2] hover:text-[#6e6e73] transition-colors cursor-pointer px-1"
            >
              <Info className="w-3.5 h-3.5" />
              {isGuideOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Rehber açıklaması */}
        {isGuideOpen && (
          <div className="mt-3 space-y-3">
            <p className="text-[12px] text-[#6e6e73] leading-relaxed">{criterion.description}</p>

            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-wider">Değerlendirme Kırılımları</p>
              <ul className="space-y-1">
                {criterion.subQuestions.map((q, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] text-[#6e6e73]">
                    <span className="text-[#d1d1d6] mt-0.5 shrink-0">•</span>
                    {q}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-[#aeaeb2] uppercase tracking-wider">Puan Açıklamaları</p>
              <div className="grid grid-cols-1 gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div key={n} className="flex items-center gap-2 text-[11px]">
                    <span className="w-5 h-5 rounded-md bg-[#f0f0f0] flex items-center justify-center font-bold text-[#6e6e73] shrink-0">{n}</span>
                    <span className="text-[#6e6e73]">{criterion.scoreLabels[n]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Puanlama + Gerekçe */}
      <div className="px-4 pb-4 space-y-2">
        {/* Puan butonları */}
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              disabled={!canEvaluate}
              onClick={() => onUpdate("score", n)}
              title={criterion.scoreLabels[n]}
              className={`flex-1 py-2.5 rounded-lg text-[13px] font-semibold transition-all cursor-pointer
                ${entry.score === n
                  ? "bg-[#1c1c1c] text-white shadow-sm"
                  : "bg-[#f5f5f5] text-[#6e6e73] hover:bg-[#ebebeb]"
                }
                disabled:cursor-default disabled:opacity-50`}
            >
              {n}
            </button>
          ))}
        </div>

        {/* Gerekçe */}
        <textarea
          disabled={!canEvaluate}
          value={entry.justification}
          onChange={(e) => onUpdate("justification", e.target.value)}
          placeholder="Gerekçe ve gözlemleriniz (en az 10 karakter)…"
          rows={2}
          className={`w-full px-3 py-2 bg-[#f5f5f5] border-0 rounded-lg text-[12px] text-[#1c1c1c] placeholder:text-[#aeaeb2] resize-none focus:outline-none focus:ring-1 transition-all disabled:opacity-50
            ${justTooShort ? "ring-1 ring-red-400/60" : "focus:ring-[#fab758]/40 focus:bg-white"}`}
        />
        {justTooShort && (
          <p className="text-[11px] text-red-500">En az 10 karakter gerekli.</p>
        )}
      </div>
    </div>
  )
}

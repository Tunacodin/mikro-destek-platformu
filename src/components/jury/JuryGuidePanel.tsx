"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, BookOpen, Target, BarChart3, Gift, X } from "lucide-react"

type Section = {
  id: string
  icon: React.ReactNode
  title: string
  content: React.ReactNode
}

const SECTIONS: Section[] = [
  {
    id: "purpose",
    icon: <Target className="w-4 h-4" />,
    title: "Program Amacı ve Kapsamı",
    content: (
      <div className="space-y-3 text-[13px] text-[#6e6e73] leading-relaxed">
        <p>
          <strong className="text-[#1c1c1c]">Mikro Destek Fonu</strong>, Divizyon inovasyon ekosisteminde
          yer alan birey ve ekiplerin projelerini hayata geçirmelerini desteklemek amacıyla oluşturulmuş
          bir <strong className="text-[#1c1c1c]">ayni destek programı</strong>dır.
        </p>
        <p>
          Program, açık inovasyon anlayışıyla çalışır. Teknoloji, sanat, kültür, içerik üretimi ve
          araştırma/akademik alanlarda yenilikçi projelere kaynak, araç, mentör ve altyapı desteği sağlar.
        </p>
        <p>
          <strong className="text-[#1c1c1c]">Önemli:</strong> Mikro Destek Fonu nakdi destek sunmaz.
          Tüm destekler ayni destek (hizmet, araç, mentör, altyapı vb.) olarak sağlanır.
        </p>
        <ul className="space-y-1.5 pl-1">
          <li className="flex items-start gap-2"><span className="text-[#d1d1d6] mt-0.5 shrink-0">-</span>Divizyon ekosistemi içindeki birey ve ekiplere yöneliktir</li>
          <li className="flex items-start gap-2"><span className="text-[#d1d1d6] mt-0.5 shrink-0">-</span>Açık inovasyon ve topluluk odaklı yaklaşım benimsenir</li>
          <li className="flex items-start gap-2"><span className="text-[#d1d1d6] mt-0.5 shrink-0">-</span>Proje çıktıları topluluğun faydasına sunulabilir olmalıdır</li>
          <li className="flex items-start gap-2"><span className="text-[#d1d1d6] mt-0.5 shrink-0">-</span>Dönemsel başvuru ve değerlendirme süreci uygulanır</li>
        </ul>
      </div>
    ),
  },
  {
    id: "criteria",
    icon: <BarChart3 className="w-4 h-4" />,
    title: "Değerlendirme Kriterleri",
    content: (
      <div className="space-y-4 text-[13px]">
        {[
          { num: 1, key: "Yenilikçilik ve Özgünlük", desc: "Mevcut yöntem ve üretimlerden ayrışan, yeni bir yaklaşım veya değer sunma kapasitesi. Projenin özgün niteliği, yaratıcı katkısı ve alanındaki farklılaştırıcı yönleri.", scores: "1: Kopya/Tekrarlayan | 2: Kısmen Yeni | 3: Orta Özgün | 4: Belirgin Özgün | 5: Çok Yüksek Özgünlük" },
          { num: 2, key: "Uygulanabilirlik ve Olgunluk", desc: "Proje tanımının açıklığı, teknik/sanatsal hayata geçirebilirlik ve proje planının bütünlüğü. Ekip yeterliliği, zaman yönetimi ve kaynak planlaması.", scores: "1: Belirsiz | 2: Zayıf Plan | 3: Orta Hazır | 4: Güçlü Plan | 5: Çok Yüksek Uygulanabilirlik" },
          { num: 3, key: "Topluluk Katkısı", desc: "Divizyon topluluğuna sağlayacağı fayda, paylaşıma uygunluk ve ortak üretim imkânı yaratma kapasitesi.", scores: "1: Katkısız | 2: Sınırlı Katkı | 3: Orta Katkı | 4: Yüksek Katkı | 5: Kolektif Fayda" },
          { num: 4, key: "Ekosistem ve Toplumsal Etki", desc: "Yerel, ulusal ve uluslararası ölçekte yaratılacak katkı, sosyal fayda ve sürdürülebilirlik boyutu.", scores: "1: Etkisiz | 2: Sınırlı Etki | 3: Yerel Katkı | 4: Ulusal Katkı | 5: Uluslararası & Sürdürülebilir" },
          { num: 5, key: "Kaynak Uygunluğu ve Verimlilik", desc: "Talep edilen destek kalemlerinin gerçekçi, amaca uygun ve ölçülü olup olmadığı. Kaynakların verimli kullanımı.", scores: "1: Uygunsuz | 2: Zayıf Uyum | 3: Kısmen Gerçekçi | 4: Verimli | 5: Az Kaynakla Büyük Etki" },
          { num: 6, key: "Çıktı ve Sonuç Potansiyeli", desc: "Kısa vadede somut ürün, eser, hizmet veya deneyim çıktısı üretebilme kapasitesi.", scores: "1: Belirsiz Çıktı | 2: Sınırlı Çıktı | 3: Makul Potansiyel | 4: Somut Katkı | 5: Kalıcı Etki" },
          { num: 7, key: "Görünürlük ve İtibar Katkısı", desc: "Divizyon'un kurumsal itibarı, tanınırlık ve görünürlüğüne katkı. Vitrinlenebilirlik ve medya değeri.", scores: "1: Etkisiz | 2: Zayıf Görünürlük | 3: Kısmi Prestij | 4: Güçlü Prestij | 5: Stratejik Vitrin" },
          { num: "B", key: "Bonus: Motivasyon & Sunum", desc: "Başvurunun sunum kalitesi, anlatım tutarlılığı ve motivasyon düzeyi. Toplam puana ek olarak eklenir.", scores: "1: Zayıf | 2: Orta Altı | 3: Orta | 4: İyi | 5: Çok İyi" },
        ].map((c) => (
          <div key={c.num} className="space-y-1">
            <div className="flex items-start gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#f0f0f0] flex items-center justify-center text-[11px] font-bold text-[#6e6e73] shrink-0">{c.num}</span>
              <div>
                <p className="font-semibold text-[#1c1c1c]">{c.key}</p>
                <p className="text-[#6e6e73] leading-relaxed mt-0.5">{c.desc}</p>
                <p className="text-[11px] text-[#aeaeb2] mt-1">{c.scores}</p>
              </div>
            </div>
          </div>
        ))}
        <p className="text-[12px] text-[#aeaeb2] mt-2">Her kriter 1-5 arası puanlanır. Gerekçe yazmak zorunludur (min. 10 karakter).</p>
      </div>
    ),
  },
  {
    id: "bands",
    icon: <BarChart3 className="w-4 h-4" />,
    title: "Puan Aralıkları ve Destek Kapsamları",
    content: (
      <div className="space-y-3">
        {[
          { range: "< 23 puan", label: "Desteklenemez", desc: "Başvuru destek için uygun bulunmamıştır.", color: "bg-red-50 border-red-100 text-red-600" },
          { range: "23 - 26 puan", label: "Sınırlı Destek", desc: "Sınırlı kapsamda ayni destek sağlanır.", color: "bg-orange-50 border-orange-100 text-orange-600" },
          { range: "27 - 30 puan", label: "Genişletilmiş Destek", desc: "Genişletilmiş kapsamda ayni destek sağlanır.", color: "bg-amber-50 border-amber-100 text-amber-600" },
          { range: "30+ puan", label: "Öncelikli Destek", desc: "Öncelikli ve kapsamlı ayni destek sağlanır.", color: "bg-emerald-50 border-emerald-100 text-emerald-600" },
        ].map((b) => (
          <div key={b.label} className={`rounded-xl border px-4 py-3 ${b.color}`}>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold">{b.label}</span>
              <span className="text-[12px] font-medium">{b.range}</span>
            </div>
            <p className="text-[12px] mt-1 opacity-80">{b.desc}</p>
          </div>
        ))}
        <p className="text-[11px] text-[#aeaeb2] mt-1">Puanlar 7 ana kriter (maks. 35) + 1 bonus (maks. 5) = toplam 40 puan üzerinden hesaplanır.</p>
      </div>
    ),
  },
  {
    id: "supports",
    icon: <Gift className="w-4 h-4" />,
    title: "Destek Türleri",
    content: (
      <div className="space-y-2 text-[13px]">
        <p className="text-[#6e6e73] leading-relaxed mb-3">
          Mikro Destek Fonu kapsamında sağlanabilecek ayni destek türleri:
        </p>
        <ul className="space-y-2">
          {[
            { title: "Yazılım & Araç Lisansı", desc: "Proje için gerekli yazılım, araç ve platform lisansları" },
            { title: "Teknik Altyapı", desc: "Sunucu, hosting, domain ve bulut hizmetleri" },
            { title: "Mentorluk", desc: "Alanında uzman mentörlerle birebir veya grup çalışmaları" },
            { title: "Eğitim & Workshop", desc: "Beceri geliştirme programları ve atölye çalışmaları" },
            { title: "Tasarım & Medya Desteği", desc: "Görsel tasarım, video prodüksiyon ve içerik üretimi" },
            { title: "Alan & Mekân Kullanımı", desc: "Çalışma alanı, etkinlik mekânı ve stüdyo kullanımı" },
            { title: "Tanıtım & PR", desc: "Medya ilişkileri, sosyal medya ve etkinlik desteği" },
            { title: "Ağ & Bağlantı", desc: "Sektörel ağlar, yatırımcı erişimi ve iş birliği fırsatları" },
          ].map((s, i) => (
            <li key={i} className="flex items-start gap-3 bg-[#fafafa] rounded-xl px-3.5 py-2.5 border border-[#f0f0f0]">
              <span className="w-5 h-5 rounded-md bg-[#f0f0f0] flex items-center justify-center text-[10px] font-bold text-[#6e6e73] shrink-0 mt-0.5">{i + 1}</span>
              <div>
                <p className="font-medium text-[#1c1c1c]">{s.title}</p>
                <p className="text-[#6e6e73] text-[12px] mt-0.5">{s.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
]

// ── Standalone Panel (dashboard için) ───────────────────────────────────────

export function JuryGuidePanel() {
  const [openSection, setOpenSection] = useState<string | null>(null)

  return (
    <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_6px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="px-5 py-4 border-b border-black/[0.04] flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-[#fab758]" />
        <p className="text-[13px] font-semibold text-[#1c1c1c]">Değerlendirme Rehberi</p>
      </div>

      <div className="divide-y divide-black/[0.04]">
        {SECTIONS.map((section) => {
          const isOpen = openSection === section.id
          return (
            <div key={section.id}>
              <button
                onClick={() => setOpenSection(isOpen ? null : section.id)}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-[#fafafa] transition-colors cursor-pointer"
              >
                <span className="text-[#aeaeb2]">{section.icon}</span>
                <span className="flex-1 text-[13px] font-medium text-[#1c1c1c]">{section.title}</span>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-[#aeaeb2]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#aeaeb2]" />
                )}
              </button>
              {isOpen && (
                <div className="px-5 pb-4">
                  {section.content}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Modal (değerlendirme sayfası için) ──────────────────────────────────────

export function JuryGuideModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const [openSection, setOpenSection] = useState<string | null>(null)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col mx-4">
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-[#e8e8e8]">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#fab758]" />
            <p className="text-[15px] font-semibold text-[#1c1c1c]">Değerlendirme Rehberi</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#aeaeb2] hover:text-[#1c1c1c] hover:bg-[#f0f0f0] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-black/[0.04]">
          {SECTIONS.map((section) => {
            const isSectionOpen = openSection === section.id
            return (
              <div key={section.id}>
                <button
                  onClick={() => setOpenSection(isSectionOpen ? null : section.id)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-[#fafafa] transition-colors cursor-pointer"
                >
                  <span className="text-[#aeaeb2]">{section.icon}</span>
                  <span className="flex-1 text-[13px] font-medium text-[#1c1c1c]">{section.title}</span>
                  {isSectionOpen ? (
                    <ChevronUp className="w-4 h-4 text-[#aeaeb2]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#aeaeb2]" />
                  )}
                </button>
                {isSectionOpen && (
                  <div className="px-5 pb-4">
                    {section.content}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useRef } from "react"
import { Printer, Save, CheckCircle2 } from "lucide-react"

/* ─── Sabit listeler ─── */
const SCOPE_OPTIONS: { value: string; label: string }[] = [
  { value: "UNSUPPORTED", label: "Desteklenmez" },
  { value: "LIMITED",     label: "Sınırlı Destek" },
  { value: "EXTENDED",    label: "Genişletilmiş Destek" },
  { value: "PRIORITY",    label: "Öncelikli Proje (Showcase / Vitrinleme / Hızlandırılmış Erişim)" },
]

/* ─── Tipler ─── */
type Page1 = {
  projectTitle:  string
  applicantName: string
  applicationId: string
  submittedDate: string
  juryNames:     string
  avgScore:      string
  scope:         string
  authorName:    string
  decisionDate:  string
}

type Page2 = {
  strategicReason:             string
  approvedConditionalSupports: string
  expectedOutputs:             string
  supportDuration:             string
  monitoringObligations:       string
  riskFramework:               string
}

export function DecisionReportClient({
  decisionId,
  initial,
  border,
  labelBg,
}: {
  decisionId: string
  initial:    Page1 & Page2
  border:     string
  labelBg:    string
}) {
  /* Page 1 — yalnızca oturum içinde geçerli (baskı için düzenleme) */
  const [p1, setP1] = useState<Page1>({
    projectTitle:  initial.projectTitle,
    applicantName: initial.applicantName,
    applicationId: initial.applicationId,
    submittedDate: initial.submittedDate,
    juryNames:     initial.juryNames,
    avgScore:      initial.avgScore,
    scope:         initial.scope,
    authorName:    initial.authorName,
    decisionDate:  initial.decisionDate,
  })

  /* Page 2 + Destek Süresi — veritabanına kaydedilir */
  const [p2, setP2] = useState<Page2>({
    strategicReason:             initial.strategicReason,
    approvedConditionalSupports: initial.approvedConditionalSupports,
    expectedOutputs:             initial.expectedOutputs,
    supportDuration:             initial.supportDuration,
    monitoringObligations:       initial.monitoringObligations,
    riskFramework:               initial.riskFramework,
  })

  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const pendingRef = useRef(false)

  function setP1Field(key: keyof Page1, value: string) {
    setP1((p) => ({ ...p, [key]: value }))
  }
  function setP2Field(key: keyof Page2, value: string) {
    setP2((p) => ({ ...p, [key]: value }))
    setSaved(false)
  }

  async function handleSave() {
    if (pendingRef.current) return
    pendingRef.current = true
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/decisions/${decisionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p2),
      })
      if (res.ok) setSaved(true)
    } finally {
      pendingRef.current = false
      setSaving(false)
    }
  }

  /* ─── Ortak sınıflar ─── */
  const inputCls    = "print-hide w-full px-3 py-2 bg-[#f5f5f5] border border-transparent rounded-lg text-[13px] text-[#1c1c1c] placeholder:text-[#c7c7cc] focus:outline-none focus:ring-2 focus:ring-[#fab758]/40 focus:bg-white focus:border-[#fab758]/30 transition-all"
  const textareaCls = "print-hide resize-none w-full px-3 py-2 bg-[#f5f5f5] border border-transparent rounded-lg text-[13px] text-[#1c1c1c] placeholder:text-[#c7c7cc] focus:outline-none focus:ring-2 focus:ring-[#fab758]/40 focus:bg-white focus:border-[#fab758]/30 transition-all"
  const valCls      = "print-val text-[12px] text-[#1c1c1c] leading-relaxed whitespace-pre-wrap min-h-[1.5em]"

  /* ─── Tablo hücre stilleri ─── */
  const tdLabel: React.CSSProperties = {
    width: "210px",
    background: labelBg,
    borderRight: `1px solid ${border}`,
    verticalAlign: "top",
    padding: "10px 12px",
    fontSize: "12px",
    color: "#1c1c1c",
  }
  const tdValue: React.CSSProperties = { verticalAlign: "top", padding: "6px 12px" }
  const rowBorder: React.CSSProperties = { borderTop: `1px solid ${border}` }

  /* ─── Checkbox bileşeni ─── */
  function Checkbox({
    checked,
    onClick,
  }: {
    checked: boolean
    onClick?: () => void
  }) {
    return (
      <span
        onClick={onClick}
        className={onClick ? "cursor-pointer" : ""}
        style={{
          display: "inline-block",
          width: "13px",
          height: "13px",
          border: `1px solid ${checked ? "#1c1c1c" : "#999"}`,
          background: checked ? "#1c1c1c" : "white",
          textAlign: "center",
          lineHeight: "13px",
          fontSize: "9px",
          color: "white",
          fontWeight: "bold",
          flexShrink: 0,
          marginTop: "1px",
        }}
      >
        {checked ? "✓" : ""}
      </span>
    )
  }

  return (
    <div>
      {/* ── Araç çubuğu (baskıda gizli) ── */}
      <div className="no-print flex items-center justify-between mb-8 bg-white border border-black/[0.07] rounded-2xl px-5 py-3.5 shadow-sm">
        <div className="flex items-center gap-3">
          {saved && (
            <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" /> Kaydedildi
            </span>
          )}
          <p className="text-[12px] text-[#aeaeb2]">
            Tüm alanlar düzenlenebilir. Destek Süresi ve Sayfa 2 içeriği veritabanına kaydedilir.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-black/[0.08] text-[#1c1c1c] text-[12px] font-semibold rounded-xl hover:bg-[#f5f5f5] disabled:opacity-40 transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1c1c1c] text-white text-[12px] font-semibold rounded-xl hover:bg-[#383838] transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Yazdır
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════
          SAYFA 1
      ══════════════════════════════════════ */}
      <section className="space-y-6">

        {/* Başlık */}
        <div>
          <h1 className="text-[26px] font-bold text-[#1c1c1c] leading-tight">
            MİKRO FONLAMA VE AĞ DESTEKLERİ
          </h1>
          <h2 className="text-[26px] font-bold text-[#1c1c1c] leading-tight">
            DESTEK SONUÇ BİLDİRİM FORMU
          </h2>
        </div>

        {/* Açıklama */}
        <div className="text-[12px] text-[#1c1c1c] leading-relaxed space-y-3">
          <p>
            Bu form Divizyon bünyesinde yürütülen Mikro Fonlama ve Ağ Destekleri mekanizması kapsamında yapılan başvuruların değerlendirilmesi sonucunda alınan kararların başvuru sahiplerine bildirilmesi ve kurumsal kayıtlara geçmesi amacıyla düzenlenmiştir. Başvurular, Divizyon Mikro Fonlama ve Ağ Destekleri Çerçeve Belgesi&apos;nde belirtilen usul ve esaslar ile Değerlendirme Formu&apos;nda yer alan ölçütler doğrultusunda incelenmiş; Disiplinel Kurul tarafından verilen nihai puanlama esas alınarak karara bağlanmıştır.
          </p>
          <p>
            Bu bildirim, söz konusu başvurunun desteklenip desteklenmediğini ve uygun görüldüğü takdirde hangi destek türlerinin sağlanacağını resmi olarak kayıt altına almaktadır. Destek türleri ayni nitelikte olup; proje sahibine veya ekibine doğrudan nakdi bir katkı sağlamaz. Onaylanan desteklerin kapsamı, süresi ve kullanım şartları, Divizyon tarafından yürütülen protokol hükümleri çerçevesinde uygulanacaktır.
          </p>
          <p>
            Bu Belge, yalnızca ilgili başvuruya özgüdür ve burada belirtilen kararlar bağlayıcı nitelik taşır. Destek sürecinin tüm aşamalarında şeffaflık, hesap verebilirlik ve adil erişim ilkeleri gözetilmiş olup, alınan karar Divizyon&apos;un kurumsal bütünlüğünü ve sürdürülebilirliğini teminat altına almaktadır.
          </p>
        </div>

        {/* Bilgi tablosu */}
        <table
          className="w-full text-[12px]"
          style={{ borderCollapse: "collapse", border: `1px solid ${border}` }}
        >
          <tbody>

            {/* Başvuru Numarası — sadece okunur */}
            <tr>
              <td className="px-3 py-2.5 text-[#1c1c1c] align-top" style={{ ...tdLabel }}>
                Başvuru Numarası:
              </td>
              <td className="px-3 py-2.5 text-[#1c1c1c]">
                <span className="font-mono text-[10px]">{p1.applicationId}</span>
              </td>
            </tr>

            {/* Proje Adı */}
            <tr style={rowBorder}>
              <td style={tdLabel}>Proje Adı:</td>
              <td style={tdValue}>
                <input
                  type="text"
                  value={p1.projectTitle}
                  onChange={(e) => setP1Field("projectTitle", e.target.value)}
                  className={inputCls}
                />
                <p className={valCls}>{p1.projectTitle}</p>
              </td>
            </tr>

            {/* Başvuru Sahibi */}
            <tr style={rowBorder}>
              <td style={tdLabel}>Başvuru Sahibi Adı Soyadı:</td>
              <td style={tdValue}>
                <input
                  type="text"
                  value={p1.applicantName}
                  onChange={(e) => setP1Field("applicantName", e.target.value)}
                  className={inputCls}
                />
                <p className={valCls}>{p1.applicantName}</p>
              </td>
            </tr>

            {/* Başvuru Tarihi */}
            <tr style={rowBorder}>
              <td style={tdLabel}>Başvuru Tarihi:</td>
              <td style={tdValue}>
                <input
                  type="text"
                  value={p1.submittedDate}
                  onChange={(e) => setP1Field("submittedDate", e.target.value)}
                  className={inputCls}
                />
                <p className={valCls}>{p1.submittedDate}</p>
              </td>
            </tr>

            {/* Değerlendirme Kurulu Üyeleri */}
            <tr style={rowBorder}>
              <td style={tdLabel}>Değerlendirme Kurulu Üyeleri:</td>
              <td style={tdValue}>
                <input
                  type="text"
                  value={p1.juryNames}
                  onChange={(e) => setP1Field("juryNames", e.target.value)}
                  placeholder="Jüri üyelerinin adlarını girin…"
                  className={inputCls}
                />
                <p className={valCls}>{p1.juryNames || "—"}</p>
              </td>
            </tr>

            {/* Değerlendirme Puanı */}
            <tr style={rowBorder}>
              <td style={tdLabel}>Değerlendirme Puanı (Ortalama):</td>
              <td style={tdValue}>
                <input
                  type="text"
                  value={p1.avgScore}
                  onChange={(e) => setP1Field("avgScore", e.target.value)}
                  placeholder="örn. 28.5 / 40"
                  className={inputCls}
                />
                <p className={valCls}>{p1.avgScore}</p>
              </td>
            </tr>

            {/* Destek Kararı */}
            <tr style={rowBorder}>
              <td style={tdLabel}>Destek Kararı:</td>
              <td className="px-3 py-3" style={{ borderTop: undefined }}>
                <div className="space-y-1.5">
                  {SCOPE_OPTIONS.map(({ value, label }) => {
                    const isChecked = p1.scope === value
                    return (
                      <div
                        key={value}
                        className="flex items-start gap-2 cursor-pointer select-none"
                        onClick={() => setP1Field("scope", value)}
                      >
                        <Checkbox checked={isChecked} />
                        <span className={`text-[12px] ${isChecked ? "font-semibold text-[#1c1c1c]" : "text-[#555]"}`}>
                          {label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </td>
            </tr>

            {/* Destek Süresi */}
            <tr style={rowBorder}>
              <td style={tdLabel}>Destek Süresi:</td>
              <td style={tdValue}>
                <input
                  type="text"
                  value={p2.supportDuration}
                  onChange={(e) => setP2Field("supportDuration", e.target.value)}
                  placeholder="örn. 3 ay, 6 ay…"
                  className={inputCls}
                />
                <p className={valCls}>{p2.supportDuration}</p>
              </td>
            </tr>

          </tbody>
        </table>

        {/* Sonuç Bildirimi — Yetkili / Tarih / İmza */}
        <div className="space-y-3">
          <h3 className="text-[22px] font-bold text-[#1c1c1c]">SONUÇ BİLDİRİMİ</h3>
          <table
            className="w-full text-[12px]"
            style={{ borderCollapse: "collapse", border: `1px solid ${border}` }}
          >
            <thead>
              <tr style={{ borderBottom: `1px solid ${border}` }}>
                <th
                  className="px-3 py-2.5 text-left font-semibold text-[#1c1c1c]"
                  style={{ width: "33%", background: labelBg, borderRight: `1px solid ${border}` }}
                >
                  Yetkilinin Adı-Soyadı:
                </th>
                <th
                  className="px-3 py-2.5 text-left font-semibold text-[#1c1c1c]"
                  style={{ width: "33%", background: labelBg, borderRight: `1px solid ${border}` }}
                >
                  Karar Tarihi:
                </th>
                <th
                  className="px-3 py-2.5 text-left font-semibold text-[#1c1c1c]"
                  style={{ width: "34%", background: labelBg }}
                >
                  İmza:
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-3 py-4 text-[#1c1c1c] align-top" style={{ borderRight: `1px solid ${border}` }}>
                  <input
                    type="text"
                    value={p1.authorName}
                    onChange={(e) => setP1Field("authorName", e.target.value)}
                    className={inputCls}
                  />
                  <p className={valCls}>{p1.authorName}</p>
                  <div className="print-hide h-6" />
                </td>
                <td className="px-3 py-4 text-[#1c1c1c] align-top" style={{ borderRight: `1px solid ${border}` }}>
                  <input
                    type="text"
                    value={p1.decisionDate}
                    onChange={(e) => setP1Field("decisionDate", e.target.value)}
                    className={inputCls}
                  />
                  <p className={valCls}>{p1.decisionDate}</p>
                  <div className="print-hide h-6" />
                </td>
                <td className="px-3 py-4 align-top">
                  <div className="h-16" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </section>

      {/* ══════════════════════════════════════
          SAYFA 2 — Admin doldurur
      ══════════════════════════════════════ */}
      <div className="print-break mt-10">
        <section>
          <h2 className="text-[22px] font-bold text-[#1c1c1c] mb-5">
            MİKRO FONLAMA DESTEK KAPSAMI
          </h2>

          <table
            className="w-full text-[12px]"
            style={{ borderCollapse: "collapse", border: `1px solid ${border}` }}
          >
            <tbody>

              {/* Stratejik Uyum Gerekçesi */}
              <tr>
                <td style={tdLabel}>Stratejik Uyum Gerekçesi:</td>
                <td style={tdValue}>
                  <textarea
                    value={p2.strategicReason}
                    onChange={(e) => setP2Field("strategicReason", e.target.value)}
                    placeholder="Projenin Divizyon stratejik hedefleriyle uyumunu açıklayın…"
                    rows={3}
                    className={textareaCls}
                  />
                  <p className={valCls}>{p2.strategicReason}</p>
                </td>
              </tr>

              {/* Kesin Onaylı Destekler ve Koşullu Destekler */}
              <tr style={rowBorder}>
                <td style={tdLabel}>Kesin Onaylı Destekler ve Koşullu Destekler:</td>
                <td style={tdValue}>
                  <textarea
                    value={p2.approvedConditionalSupports}
                    onChange={(e) => setP2Field("approvedConditionalSupports", e.target.value)}
                    placeholder="Kesin onaylanan destekler ile koşula bağlı destekleri ve bağlı oldukları koşulları belirtin…"
                    rows={4}
                    className={textareaCls}
                  />
                  <p className={valCls}>{p2.approvedConditionalSupports}</p>
                </td>
              </tr>

              {/* Beklenen Somut Çıktı ve Aksiyonlar */}
              <tr style={rowBorder}>
                <td style={tdLabel}>Beklenen Somut Çıktı ve Aksiyonlar:</td>
                <td style={tdValue}>
                  <textarea
                    value={p2.expectedOutputs}
                    onChange={(e) => setP2Field("expectedOutputs", e.target.value)}
                    placeholder="Destek sonucunda beklenen ürün, eser veya katkılar ve atılacak somut aksiyonlar…"
                    rows={4}
                    className={textareaCls}
                  />
                  <p className={valCls}>{p2.expectedOutputs}</p>
                </td>
              </tr>

              {/* İzleme, Raporlama ve Değerlendirme Yükümlülükleri */}
              <tr style={rowBorder}>
                <td style={tdLabel}>İzleme, Raporlama ve Değerlendirme Yükümlülükleri:</td>
                <td style={{ ...tdValue, minHeight: "150px" }}>
                  <textarea
                    value={p2.monitoringObligations}
                    onChange={(e) => setP2Field("monitoringObligations", e.target.value)}
                    placeholder="Raporlama sıklığı, izleme yöntemi ve değerlendirme yükümlülükleri…"
                    rows={6}
                    className={textareaCls}
                  />
                  <p className={`${valCls} min-h-[130px]`}>{p2.monitoringObligations}</p>
                </td>
              </tr>

              {/* Risk ve Sorumluluk */}
              <tr style={rowBorder}>
                <td style={tdLabel}>Risk ve Sorumluluk Çerçevesi:</td>
                <td style={tdValue}>
                  <textarea
                    value={p2.riskFramework}
                    onChange={(e) => setP2Field("riskFramework", e.target.value)}
                    placeholder="Proje riskleri ve sorumluluk dağılımı…"
                    rows={3}
                    className={textareaCls}
                  />
                  <p className={valCls}>{p2.riskFramework}</p>
                </td>
              </tr>

            </tbody>
          </table>
        </section>
      </div>
    </div>
  )
}

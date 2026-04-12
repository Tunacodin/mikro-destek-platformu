"use client"

import { useState, useRef } from "react"
import { Printer, Save, CheckCircle2 } from "lucide-react"

const SUPPORT_TYPES_ALL = [
  "Üretim ve Altyapı Desteği",
  "Yazılım ve Teknik Araç Desteği",
  "Materyal ve Envanter Desteği",
  "Mentorluk ve Uzmanlık Desteği",
  "Akademik Üretim Desteği",
  "Görünürlük ve Mikrofonlama Desteği",
  "Telif, Hak ve Yayıncılık Desteği",
  "Dış Temsil ve Seyahat Desteği",
]

type DecisionFields = {
  strategicReason:      string
  expectedOutputs:      string
  supportDuration:      string
  additionalConditions: string
  riskFramework:        string
}

export function DecisionReportClient({
  decisionId,
  initial,
  approvedSupportTypes,
  border,
  labelBg,
}: {
  decisionId:          string
  initial:             DecisionFields
  approvedSupportTypes: string[]
  border:              string
  labelBg:             string
}) {
  const [fields, setFields] = useState<DecisionFields>(initial)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const pendingRef = useRef(false)

  function setField(key: keyof DecisionFields, value: string) {
    setFields((p) => ({ ...p, [key]: value }))
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
        body: JSON.stringify(fields),
      })
      if (res.ok) setSaved(true)
    } finally {
      pendingRef.current = false
      setSaving(false)
    }
  }

  /* print-hide  → ekranda görünür, baskıda gizli (globals.css @media print kuralı) */
  /* print-val   → ekranda gizli,   baskıda görünür (page.tsx <style> kuralı)       */
  const inputCls    = "print-hide w-full px-3 py-2 bg-[#f5f5f5] border border-transparent rounded-lg text-[13px] text-[#1c1c1c] placeholder:text-[#c7c7cc] focus:outline-none focus:ring-2 focus:ring-[#fab758]/40 focus:bg-white focus:border-[#fab758]/30 transition-all"
  const textareaCls = "print-hide resize-none w-full px-3 py-2 bg-[#f5f5f5] border border-transparent rounded-lg text-[13px] text-[#1c1c1c] placeholder:text-[#c7c7cc] focus:outline-none focus:ring-2 focus:ring-[#fab758]/40 focus:bg-white focus:border-[#fab758]/30 transition-all"
  const valCls      = "print-val text-[12px] text-[#1c1c1c] leading-relaxed whitespace-pre-wrap min-h-[1.5em]"

  const tdLabel: React.CSSProperties = {
    width: "210px",
    background: labelBg,
    borderRight: `1px solid ${border}`,
    verticalAlign: "top",
    padding: "10px 12px",
    fontSize: "12px",
    color: "#1c1c1c",
  }

  const tdValue: React.CSSProperties = {
    verticalAlign: "top",
    padding: "6px 12px",
  }

  const rowBorder: React.CSSProperties = {
    borderTop: `1px solid ${border}`,
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
            Eksik alanları doldurun, kaydedin, ardından yazdırın.
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

      {/* ── Sayfa 2 içeriği ── */}
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
                  value={fields.strategicReason}
                  onChange={(e) => setField("strategicReason", e.target.value)}
                  placeholder="Projenin Divizyon stratejik hedefleriyle uyumunu açıklayın…"
                  rows={3}
                  className={textareaCls}
                />
                <p className={valCls}>{fields.strategicReason}</p>
              </td>
            </tr>

            {/* Beklenen Somut Çıktılar */}
            <tr style={rowBorder}>
              <td style={tdLabel}>Beklenen Somut Çıktılar:</td>
              <td style={tdValue}>
                <textarea
                  value={fields.expectedOutputs}
                  onChange={(e) => setField("expectedOutputs", e.target.value)}
                  placeholder="Destek sonucunda beklenen ürün, eser veya katkılar…"
                  rows={3}
                  className={textareaCls}
                />
                <p className={valCls}>{fields.expectedOutputs}</p>
              </td>
            </tr>

            {/* Onaylanan Destek Türleri */}
            <tr style={rowBorder}>
              <td style={tdLabel}>Onaylanan Destek Türleri:</td>
              <td style={{ ...tdValue, padding: "10px 12px" }}>
                <div className="space-y-1.5">
                  {SUPPORT_TYPES_ALL.map((type) => {
                    const checked = approvedSupportTypes.includes(type)
                    return (
                      <div key={type} className="flex items-start gap-2">
                        <span
                          className="shrink-0 mt-[1px]"
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
                          }}
                        >
                          {checked ? "✓" : ""}
                        </span>
                        <span className={`text-[12px] ${checked ? "font-semibold text-[#1c1c1c]" : "text-[#555]"}`}>
                          {type}
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
                  value={fields.supportDuration}
                  onChange={(e) => setField("supportDuration", e.target.value)}
                  placeholder="örn. 3 ay, 6 ay…"
                  className={inputCls}
                />
                <p className={valCls}>{fields.supportDuration}</p>
              </td>
            </tr>

            {/* Ek Açıklamalar */}
            <tr style={rowBorder}>
              <td style={tdLabel}>
                <p className="font-medium text-[#1c1c1c]">Ek Açıklamalar ve Şartlar:</p>
                <p className="text-[10px] text-[#888] mt-1 leading-relaxed">
                  (Destek kapsamına ilişkin özel notlar, süre, kullanım şartları, raporlama
                  yükümlülükleri, sınırlı destek kapsamı ve içeriği vb.)
                </p>
              </td>
              <td style={{ ...tdValue, minHeight: "180px" }}>
                <textarea
                  value={fields.additionalConditions}
                  onChange={(e) => setField("additionalConditions", e.target.value)}
                  placeholder="Özel şartlar, kısıtlamalar, raporlama yükümlülükleri…"
                  rows={8}
                  className={textareaCls}
                />
                <p className={`${valCls} min-h-[160px]`}>{fields.additionalConditions}</p>
              </td>
            </tr>

            {/* Risk ve Sorumluluk */}
            <tr style={rowBorder}>
              <td style={tdLabel}>Risk ve Sorumluluk Çerçevesi:</td>
              <td style={tdValue}>
                <textarea
                  value={fields.riskFramework}
                  onChange={(e) => setField("riskFramework", e.target.value)}
                  placeholder="Proje riskleri ve sorumluluk dağılımı…"
                  rows={3}
                  className={textareaCls}
                />
                <p className={valCls}>{fields.riskFramework}</p>
              </td>
            </tr>

          </tbody>
        </table>
      </section>
    </div>
  )
}

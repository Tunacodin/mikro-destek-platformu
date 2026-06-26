/* Salt-okunur "Destek Sonuç Bildirimi" görünümü.
   Admin'deki DecisionReportClient'ın düzenlenemez sürümü — jüri ve başvuran için.
   showEvaluation=false iken jüri üyeleri ve ortalama puan satırları gizlenir (başvuran). */

const BORDER = "#c8c8c8"
const LABEL_BG = "#f5f5f5"

const SCOPE_OPTIONS: { value: string; label: string }[] = [
  { value: "UNSUPPORTED", label: "Desteklenmez" },
  { value: "LIMITED", label: "Sınırlı Destek" },
  { value: "EXTENDED", label: "Genişletilmiş Destek" },
  { value: "PRIORITY", label: "Öncelikli Proje (Showcase / Vitrinleme / Hızlandırılmış Erişim)" },
]

const INTRO = [
  "Bu form Divizyon bünyesinde yürütülen Mikro Fonlama ve Ağ Destekleri mekanizması kapsamında yapılan başvuruların değerlendirilmesi sonucunda alınan kararların başvuru sahiplerine bildirilmesi ve kurumsal kayıtlara geçmesi amacıyla düzenlenmiştir. Başvurular, Divizyon Mikro Fonlama ve Ağ Destekleri Çerçeve Belgesi'nde belirtilen usul ve esaslar ile Değerlendirme Formu'nda yer alan ölçütler doğrultusunda incelenmiş; Disiplinel Kurul tarafından verilen nihai puanlama esas alınarak karara bağlanmıştır.",
  "Bu bildirim, söz konusu başvurunun desteklenip desteklenmediğini ve uygun görüldüğü takdirde hangi destek türlerinin sağlanacağını resmi olarak kayıt altına almaktadır. Destek türleri ayni nitelikte olup; proje sahibine veya ekibine doğrudan nakdi bir katkı sağlamaz. Onaylanan desteklerin kapsamı, süresi ve kullanım şartları, Divizyon tarafından yürütülen protokol hükümleri çerçevesinde uygulanacaktır.",
  "Bu Belge, yalnızca ilgili başvuruya özgüdür ve burada belirtilen kararlar bağlayıcı nitelik taşır. Destek sürecinin tüm aşamalarında şeffaflık, hesap verebilirlik ve adil erişim ilkeleri gözetilmiş olup, alınan karar Divizyon'un kurumsal bütünlüğünü ve sürdürülebilirliğini teminat altına almaktadır.",
]

export type DecisionReportData = {
  projectTitle: string
  applicantName: string
  applicationId: string
  submittedDate: string
  juryNames: string
  avgScore: string
  scope: string
  authorName: string
  decisionDate: string
  strategicReason: string
  approvedConditionalSupports: string
  expectedOutputs: string
  supportDuration: string
  monitoringObligations: string
  riskFramework: string
}

const tdLabel: React.CSSProperties = {
  width: "210px",
  background: LABEL_BG,
  borderRight: `1px solid ${BORDER}`,
  verticalAlign: "top",
  padding: "10px 12px",
  fontSize: "12px",
  color: "#1c1c1c",
}
const tdValue: React.CSSProperties = { verticalAlign: "top", padding: "10px 12px" }
const rowBorder: React.CSSProperties = { borderTop: `1px solid ${BORDER}` }
const valCls = "text-[12px] text-[#1c1c1c] leading-relaxed whitespace-pre-wrap"

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
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

function Field({ label, value }: { label: string; value: string }) {
  return (
    <tr style={rowBorder}>
      <td style={tdLabel}>{label}</td>
      <td style={tdValue}>
        <p className={valCls}>{value || "—"}</p>
      </td>
    </tr>
  )
}

export function DecisionReportView({
  data,
  showEvaluation = true,
}: {
  data: DecisionReportData
  showEvaluation?: boolean
}) {
  return (
    <div>
      <style>{`
        @media print {
          html, body  { margin: 0; padding: 0; }
          body        { -webkit-print-color-adjust: exact; print-color-adjust: exact; font-size: 11px; }
          .no-print   { display: none !important; }
          .print-break{ page-break-before: always; break-before: page; }
          .report-wrap{ max-width: none !important; padding: 0 !important; margin: 0 !important; }
          table       { border-collapse: collapse; width: 100%; }
          td, th      { border-color: ${BORDER} !important; }
        }
        @page { margin: 20mm; }
      `}</style>

      {/* Salt-okunur bilgi notu — baskıda gizli */}
      <div className="no-print mb-8 bg-white border border-black/[0.07] rounded-2xl px-5 py-3.5 shadow-sm">
        <p className="text-[12px] text-[#aeaeb2]">
          Bu belge salt-okunurdur. Düzenleme yetkisi yalnızca program yöneticisindedir.
        </p>
      </div>

      {/* ══════════ SAYFA 1 ══════════ */}
      <section className="space-y-6">
        <div>
          <h1 className="text-[26px] font-bold text-[#1c1c1c] leading-tight">
            MİKRO FONLAMA VE AĞ DESTEKLERİ
          </h1>
          <h2 className="text-[26px] font-bold text-[#1c1c1c] leading-tight">
            DESTEK SONUÇ BİLDİRİM FORMU
          </h2>
        </div>

        <div className="text-[12px] text-[#1c1c1c] leading-relaxed space-y-3">
          {INTRO.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <table
          className="w-full text-[12px]"
          style={{ borderCollapse: "collapse", border: `1px solid ${BORDER}` }}
        >
          <tbody>
            <tr>
              <td style={tdLabel}>Başvuru Numarası:</td>
              <td style={tdValue}>
                <span className="font-mono text-[10px]">{data.applicationId}</span>
              </td>
            </tr>
            <Field label="Proje Adı:" value={data.projectTitle} />
            <Field label="Başvuru Sahibi Adı Soyadı:" value={data.applicantName} />
            <Field label="Başvuru Tarihi:" value={data.submittedDate} />
            {showEvaluation && <Field label="Değerlendirme Kurulu Üyeleri:" value={data.juryNames} />}
            {showEvaluation && <Field label="Değerlendirme Puanı (Ortalama):" value={data.avgScore} />}

            <tr style={rowBorder}>
              <td style={tdLabel}>Destek Kararı:</td>
              <td className="px-3 py-3">
                <div className="space-y-1.5">
                  {SCOPE_OPTIONS.map(({ value, label }) => {
                    const checked = data.scope === value
                    return (
                      <div key={value} className="flex items-start gap-2 select-none">
                        <Checkbox checked={checked} />
                        <span className={`text-[12px] ${checked ? "font-semibold text-[#1c1c1c]" : "text-[#555]"}`}>
                          {label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </td>
            </tr>

            <Field label="Destek Süresi:" value={data.supportDuration} />
          </tbody>
        </table>

        <div className="space-y-3">
          <h3 className="text-[22px] font-bold text-[#1c1c1c]">SONUÇ BİLDİRİMİ</h3>
          <table
            className="w-full text-[12px]"
            style={{ borderCollapse: "collapse", border: `1px solid ${BORDER}` }}
          >
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                <th className="px-3 py-2.5 text-left font-semibold text-[#1c1c1c]" style={{ width: "33%", background: LABEL_BG, borderRight: `1px solid ${BORDER}` }}>
                  Yetkilinin Adı-Soyadı:
                </th>
                <th className="px-3 py-2.5 text-left font-semibold text-[#1c1c1c]" style={{ width: "33%", background: LABEL_BG, borderRight: `1px solid ${BORDER}` }}>
                  Karar Tarihi:
                </th>
                <th className="px-3 py-2.5 text-left font-semibold text-[#1c1c1c]" style={{ width: "34%", background: LABEL_BG }}>
                  İmza:
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-3 py-4 text-[#1c1c1c] align-top" style={{ borderRight: `1px solid ${BORDER}` }}>
                  <p className={valCls}>{data.authorName}</p>
                </td>
                <td className="px-3 py-4 text-[#1c1c1c] align-top" style={{ borderRight: `1px solid ${BORDER}` }}>
                  <p className={valCls}>{data.decisionDate}</p>
                </td>
                <td className="px-3 py-4 align-top">
                  <div className="h-16" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ══════════ SAYFA 2 ══════════ */}
      <div className="print-break mt-10">
        <section>
          <h2 className="text-[22px] font-bold text-[#1c1c1c] mb-5">
            MİKRO FONLAMA DESTEK KAPSAMI
          </h2>
          <table
            className="w-full text-[12px]"
            style={{ borderCollapse: "collapse", border: `1px solid ${BORDER}` }}
          >
            <tbody>
              <tr>
                <td style={tdLabel}>Stratejik Uyum Gerekçesi:</td>
                <td style={tdValue}><p className={valCls}>{data.strategicReason || "—"}</p></td>
              </tr>
              <Field label="Kesin Onaylı Destekler ve Koşullu Destekler:" value={data.approvedConditionalSupports} />
              <Field label="Beklenen Somut Çıktı ve Aksiyonlar:" value={data.expectedOutputs} />
              <Field label="İzleme, Raporlama ve Değerlendirme Yükümlülükleri:" value={data.monitoringObligations} />
              <Field label="Risk ve Sorumluluk Çerçevesi:" value={data.riskFramework} />
            </tbody>
          </table>
        </section>
      </div>
    </div>
  )
}

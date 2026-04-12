import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { DecisionReportClient } from "./DecisionReportClient"

export const metadata = { title: "Destek Sonuç Bildirimi — Mikro Destek Fonu" }

const SCOPE_LABELS: Record<string, { checkIndex: number }> = {
  UNSUPPORTED: { checkIndex: 0 },
  LIMITED:     { checkIndex: 1 },
  EXTENDED:    { checkIndex: 2 },
  PRIORITY:    { checkIndex: 3 },
}

const SCOPE_OPTIONS = [
  "Desteklenmez",
  "Sınırlı Destek",
  "Genişletilmiş Destek",
  "Öncelikli Proje (Showcase / Vitrinleme / Hızlandırılmış Erişim)",
]

function fmtLong(d: Date) {
  return new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
}

export default async function DecisionReportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") redirect("/login")

  const { id } = await params

  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      user:   { select: { name: true, email: true } },
      period:  { select: { title: true } },
      program: { select: { title: true } },
      decision: {
        select: {
          id: true,
          scope: true,
          notes: true,
          decidedAt: true,
          strategicReason: true,
          expectedOutputs: true,
          supportDuration: true,
          additionalConditions: true,
          riskFramework: true,
          decidedBy: { select: { name: true, email: true } },
        },
      },
      evaluations: {
        include: {
          scores: true,
          jury: { select: { name: true, email: true } },
        },
      },
    },
  })

  if (!application || !application.decision) notFound()

  const juryTotals = application.evaluations.map((ev) =>
    ev.scores.reduce((s, e) => s + e.score, 0)
  )
  const avgTotal = juryTotals.length
    ? juryTotals.reduce((a, b) => a + b, 0) / juryTotals.length
    : null

  const scopeInfo     = SCOPE_LABELS[application.decision.scope]
  const decisionDate  = fmtLong(application.decision.decidedAt)
  const submittedDate = application.submittedAt ? fmtLong(application.submittedAt) : "—"
  const juryNames     = application.evaluations.map((e) => e.jury.name ?? e.jury.email).join(", ")

  /* ─── CSS değişkenleri ─── */
  const BORDER = "#c8c8c8"
  const LABEL_BG = "#f5f5f5"

  return (
    <>
      <style>{`
        /* Ekranda gizli, baskıda görünür */
        .print-val { display: none; }

        @media print {
          html, body   { margin: 0; padding: 0; }
          body         { -webkit-print-color-adjust: exact; print-color-adjust: exact; font-size: 11px; }
          .no-print    { display: none !important; }
          .print-hide  { display: none !important; }
          .print-val   { display: block !important; }
          .print-break { page-break-before: always; break-before: page; }
          .report-wrap { max-width: none !important; padding: 0 !important; margin: 0 !important; }
          table        { border-collapse: collapse; width: 100%; }
          td, th       { border-color: ${BORDER} !important; }
        }

        @page { margin: 20mm; }
      `}</style>

      <div className="report-wrap max-w-3xl mx-auto px-4 py-6 sm:py-10">

        {/* ══════════════════════════════════════
            SAYFA 1
        ══════════════════════════════════════ */}
        <section className="space-y-6">

          {/* Başlık — PDF'te sola hizalı */}
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
            style={{ borderCollapse: "collapse", border: `1px solid ${BORDER}` }}
          >
            <tbody>
              {[
                { label: "Başvuru Numarası:",              value: <span className="font-mono text-[10px]">{application.id}</span> },
                { label: "Proje Adı:",                    value: application.title },
                { label: "Başvuru Sahibi Adı Soyadı:",    value: application.user.name ?? application.user.email },
                { label: "Başvuru Tarihi:",               value: submittedDate },
                { label: "Değerlendirme Kurulu Üyeleri:", value: juryNames || "—" },
                { label: "Değerlendirme Puanı (Ortalama):", value: avgTotal !== null ? `${avgTotal.toFixed(1)} / 40` : "—" },
              ].map(({ label, value }, i, arr) => (
                <tr
                  key={label}
                  style={{ borderBottom: i < arr.length - 1 ? `1px solid ${BORDER}` : undefined }}
                >
                  <td
                    className="px-3 py-2.5 text-[#1c1c1c] align-top"
                    style={{ width: "210px", background: LABEL_BG, borderRight: `1px solid ${BORDER}` }}
                  >
                    {label}
                  </td>
                  <td className="px-3 py-2.5 text-[#1c1c1c]">{value}</td>
                </tr>
              ))}

              {/* Destek Kararı */}
              <tr>
                <td
                  className="px-3 py-2.5 text-[#1c1c1c] align-top"
                  style={{ background: LABEL_BG, borderRight: `1px solid ${BORDER}`, borderTop: `1px solid ${BORDER}` }}
                >
                  Destek Kararı:
                </td>
                <td className="px-3 py-3" style={{ borderTop: `1px solid ${BORDER}` }}>
                  <div className="space-y-1.5">
                    {SCOPE_OPTIONS.map((opt, i) => {
                      const isChecked = scopeInfo?.checkIndex === i
                      return (
                        <div key={opt} className="flex items-start gap-2">
                          <span
                            className="shrink-0 mt-[1px]"
                            style={{
                              display: "inline-block",
                              width: "13px",
                              height: "13px",
                              border: `1px solid ${isChecked ? "#1c1c1c" : "#999"}`,
                              background: isChecked ? "#1c1c1c" : "white",
                              textAlign: "center",
                              lineHeight: "13px",
                              fontSize: "9px",
                              color: "white",
                              fontWeight: "bold",
                              flexShrink: 0,
                            }}
                          >
                            {isChecked ? "✓" : ""}
                          </span>
                          <span className={`text-[12px] ${isChecked ? "font-semibold text-[#1c1c1c]" : "text-[#555]"}`}>
                            {opt}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Sonuç Bildirimi */}
          <div className="space-y-3">
            <h3 className="text-[22px] font-bold text-[#1c1c1c]">SONUÇ BİLDİRİMİ</h3>
            <table
              className="w-full text-[12px]"
              style={{ borderCollapse: "collapse", border: `1px solid ${BORDER}` }}
            >
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <th
                    className="px-3 py-2.5 text-left font-semibold text-[#1c1c1c]"
                    style={{ width: "33%", background: LABEL_BG, borderRight: `1px solid ${BORDER}` }}
                  >
                    Yetkilinin Adı-Soyadı:
                  </th>
                  <th
                    className="px-3 py-2.5 text-left font-semibold text-[#1c1c1c]"
                    style={{ width: "33%", background: LABEL_BG, borderRight: `1px solid ${BORDER}` }}
                  >
                    Karar Tarihi:
                  </th>
                  <th
                    className="px-3 py-2.5 text-left font-semibold text-[#1c1c1c]"
                    style={{ width: "34%", background: LABEL_BG }}
                  >
                    İmza:
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td
                    className="px-3 py-10 text-[#1c1c1c] align-top"
                    style={{ borderRight: `1px solid ${BORDER}` }}
                  >
                    {application.decision.decidedBy.name ?? application.decision.decidedBy.email}
                  </td>
                  <td
                    className="px-3 py-10 text-[#1c1c1c] align-top"
                    style={{ borderRight: `1px solid ${BORDER}` }}
                  >
                    {decisionDate}
                  </td>
                  <td className="px-3 py-10 align-top" />
                </tr>
              </tbody>
            </table>
          </div>

        </section>

        {/* ══════════════════════════════════════
            SAYFA 2 — Admin doldurur
        ══════════════════════════════════════ */}
        <div className="print-break">
          <DecisionReportClient
            decisionId={application.decision.id}
            approvedSupportTypes={application.supportTypes}
            border={BORDER}
            labelBg={LABEL_BG}
            initial={{
              strategicReason:      application.decision.strategicReason      ?? "",
              expectedOutputs:      application.decision.expectedOutputs      ?? "",
              supportDuration:      application.decision.supportDuration      ?? "",
              additionalConditions: application.decision.additionalConditions ?? "",
              riskFramework:        application.decision.riskFramework        ?? "",
            }}
          />
        </div>

      </div>
    </>
  )
}

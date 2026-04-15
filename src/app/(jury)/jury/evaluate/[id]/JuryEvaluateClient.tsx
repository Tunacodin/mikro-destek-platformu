"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ChevronLeft, FileText, Calendar, Layers, User,
  ClipboardList, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, ChevronDown, BookOpen,
} from "lucide-react"
import { ApplicationDetailTabs } from "@/components/application/ApplicationDetailTabs"
import { ApplicationAccordion } from "@/components/application/ApplicationAccordion"
import { EvaluationForm } from "@/components/jury/EvaluationForm"
import { JuryGuideModal } from "@/components/jury/JuryGuidePanel"
import { LiveCountdown } from "@/components/ui/LiveCountdown"

type AppData = {
  id: string
  title: string
  summary: string | null
  teamName: string | null
  teamInfo: string | null
  targetAudience: string | null
  categories: string[]
  technologyStage: string | null
  artStage: string | null
  researchStage: string | null
  problemStatement: string | null
  solution: string | null
  innovation: string | null
  outputs: string | null
  timeline: string | null
  successCriteria: string | null
  ecosystemCollaboration: string | null
  communityContribution: string | null
  divisionContribution: string | null
  supportTypes: string[]
  supportNotes: Record<string, string> | null
}

type FileItem = { id: string; name: string; size: number; mimeType: string }

type ExistingEvaluation = {
  id: string
  comment: string | null
  scores: { id: string; criteria: string; score: number; justification: string }[]
} | null

function fmtShort(d: string) {
  return new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })
}

export function JuryEvaluateClient({
  application,
  applicant,
  period,
  files,
  canEvaluate,
  assignedAt,
  presentationDate,
  existingEvaluation,
}: {
  application: AppData
  applicant: { name: string | null; email: string }
  period: { title: string; endDate: string }
  files: FileItem[]
  canEvaluate: boolean
  assignedAt: string
  presentationDate: string | null
  existingEvaluation: ExistingEvaluation
}) {
  const [mode, setMode] = useState<"preview" | "evaluate">("preview")
  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [rightCollapsed, setRightCollapsed] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)

  // ── Önizleme modu ──────────────────────────────────────────────────────────
  if (mode === "preview") {
    return (
      <div className="space-y-6 p-6 sm:p-8 lg:p-10">
        {/* Geri */}
        <Link
          href="/jury/assignments"
          className="inline-flex items-center gap-1.5 text-[13px] text-[#6e6e73] hover:text-[#1c1c1c] transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Değerlendirmelerim
        </Link>

        {/* Header */}
        <div className="pb-6 border-b border-[#e8e8e8]">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="min-w-0 space-y-2">
              <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                canEvaluate ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-700"
              }`}>
                {canEvaluate ? "Ön İnceleme Sürecinde" : "Jüri Değerlendirme Sürecinde"}
              </span>
              <h1 className="text-[22px] font-bold text-[#1c1c1c] tracking-tight leading-snug">
                {application.title}
              </h1>
              <div className="flex items-center gap-3 flex-wrap text-[12px] text-[#6e6e73]">
                <span className="inline-flex items-center gap-1">
                  <User className="w-3 h-3 text-[#aeaeb2]" />
                  {applicant.name ?? applicant.email}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Layers className="w-3 h-3 text-[#aeaeb2]" />
                  {period.title}
                </span>
                <span className="inline-flex items-center gap-1">
                  <FileText className="w-3 h-3 text-[#aeaeb2]" />
                  {files.length} belge
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#aeaeb2]" />
                  Atandı: {fmtShort(assignedAt)}
                </span>
              </div>
            </div>

            {/* Sağ: Sunum geri sayımı + Butonlar */}
            <div className="flex flex-col items-end gap-3 shrink-0 self-start">
              {presentationDate && (
                <LiveCountdown targetDate={presentationDate} label="Jüri Sunumuna" />
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setGuideOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-black/[0.07] text-[#1c1c1c] text-[13px] font-medium rounded-xl hover:bg-[#f4f4f4] transition-colors cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-[#fab758]" />
                  Rehber
                </button>
                {canEvaluate && (
                  <button
                    onClick={() => setMode("evaluate")}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1c1c1c] text-white text-[13px] font-semibold rounded-xl shadow-sm hover:bg-[#383838] transition-colors cursor-pointer"
                  >
                    <ClipboardList className="w-4 h-4" />
                    {existingEvaluation ? "Düzenle" : "Değerlendir"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab'li basvuru detaylari */}
        <ApplicationDetailTabs
          application={application}
          files={files}
          showFileNotes
          canEvaluate={canEvaluate}
        />

        <JuryGuideModal isOpen={guideOpen} onClose={() => setGuideOpen(false)} />
      </div>
    )
  }

  // ── Değerlendirme modu (split view) ────────────────────────────────────────
  return (
    <div className="h-full flex flex-col bg-[#fafafa]">
      {/* Sabit üst bar */}
      <div className="shrink-0 bg-white border-b border-[#e8e8e8] px-5 py-3.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMode("preview")}
              className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[#6e6e73] hover:text-[#1c1c1c] hover:bg-[#f0f0f0] transition-colors cursor-pointer"
              title="Önizlemeye dön"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <h1 className="text-[16px] font-bold text-[#1c1c1c] truncate leading-tight">
                {application.title}
              </h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap text-[11px] text-[#6e6e73]">
                <span className="inline-flex items-center gap-1">
                  <User className="w-3 h-3 text-[#aeaeb2]" />
                  {applicant.name ?? applicant.email}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Layers className="w-3 h-3 text-[#aeaeb2]" />
                  {period.title}
                </span>
                <span className="inline-flex items-center gap-1">
                  <FileText className="w-3 h-3 text-[#aeaeb2]" />
                  {files.length} belge
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setGuideOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-black/[0.07] text-[#6e6e73] text-[11px] font-medium rounded-lg hover:bg-[#f4f4f4] transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#fab758]" />
              Rehber
            </button>
            <span className={`text-[11px] font-semibold px-3 py-1.5 rounded-full ${
              canEvaluate ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-700"
            }`}>
              {canEvaluate ? (existingEvaluation ? "Düzenleniyor" : "Değerlendirme Modu") : "Jüri Değerlendirme Sürecinde"}
            </span>
          </div>
        </div>
      </div>

      {/* Mobil: tab bar */}
      <MobileTabBar />

      {/* Desktop: split view */}
      <div className="hidden lg:flex flex-1 overflow-hidden">

        {/* Sol: Değerlendirme Formu */}
        {leftCollapsed ? (
          <div className="shrink-0 border-r border-[#e8e8e8] bg-white flex flex-col items-center py-3 px-1.5">
            <button onClick={() => setLeftCollapsed(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#aeaeb2] hover:text-[#1c1c1c] hover:bg-[#f0f0f0] transition-colors cursor-pointer">
              <PanelLeftOpen className="w-4 h-4" />
            </button>
            <p className="text-[10px] text-[#aeaeb2] mt-2 [writing-mode:vertical-lr] rotate-180">Değerlendirme</p>
          </div>
        ) : (
          <div className="w-1/2 border-r border-[#e8e8e8] bg-white flex flex-col transition-all duration-300">
            <div className="shrink-0 px-5 py-3 border-b border-[#e8e8e8] flex items-center justify-between">
              <p className="text-[13px] font-semibold text-[#1c1c1c] flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-[#aeaeb2]" />
                Değerlendirme Formu
              </p>
              <button onClick={() => setLeftCollapsed(true)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#aeaeb2] hover:text-[#1c1c1c] hover:bg-[#f0f0f0] transition-colors cursor-pointer">
                <PanelLeftClose className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <EvaluationForm
                applicationId={application.id}
                canEvaluate={canEvaluate}
                existingEvaluation={existingEvaluation}
              />
            </div>
          </div>
        )}

        {/* Sağ: Başvuru Akordiyon */}
        {rightCollapsed ? (
          <div className="shrink-0 border-l border-[#e8e8e8] bg-white flex flex-col items-center py-3 px-1.5">
            <button onClick={() => setRightCollapsed(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#aeaeb2] hover:text-[#1c1c1c] hover:bg-[#f0f0f0] transition-colors cursor-pointer">
              <PanelRightOpen className="w-4 h-4" />
            </button>
            <p className="text-[10px] text-[#aeaeb2] mt-2 [writing-mode:vertical-lr] rotate-180">Başvuru</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col bg-[#fafafa] min-w-0">
            <div className="shrink-0 px-5 py-3 border-b border-[#e8e8e8] bg-white flex items-center justify-between">
              <p className="text-[13px] font-semibold text-[#1c1c1c] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#aeaeb2]" />
                Başvuru Detayları
              </p>
              <button onClick={() => setRightCollapsed(true)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#aeaeb2] hover:text-[#1c1c1c] hover:bg-[#f0f0f0] transition-colors cursor-pointer">
                <PanelRightClose className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <ApplicationAccordion
                application={application}
                files={files}
                showFileNotes
                canEvaluate={canEvaluate}
              />
            </div>
          </div>
        )}
      </div>

      {/* Mobil: icerik */}
      <MobileContent
        application={application}
        files={files}
        canEvaluate={canEvaluate}
        existingEvaluation={existingEvaluation}
      />

      <JuryGuideModal isOpen={guideOpen} onClose={() => setGuideOpen(false)} />
    </div>
  )
}

// ── Mobil alt bileşenler ─────────────────────────────────────────────────────

function MobileTabBar() {
  return null // Mobilde tek scroll yapı, tab yok
}

function MobileContent({
  application,
  files,
  canEvaluate,
  existingEvaluation,
}: {
  application: AppData
  files: FileItem[]
  canEvaluate: boolean
  existingEvaluation: ExistingEvaluation
}) {
  const [mobileTab, setMobileTab] = useState<"eval" | "app">("eval")

  return (
    <>
      <div className="lg:hidden shrink-0 flex bg-white border-b border-[#e8e8e8]">
        <button
          onClick={() => setMobileTab("eval")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-[13px] font-medium transition-colors cursor-pointer border-b-2 ${
            mobileTab === "eval" ? "border-[#1c1c1c] text-[#1c1c1c]" : "border-transparent text-[#aeaeb2]"
          }`}
        >
          <ClipboardList className="w-4 h-4" /> Değerlendirme
        </button>
        <button
          onClick={() => setMobileTab("app")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-[13px] font-medium transition-colors cursor-pointer border-b-2 ${
            mobileTab === "app" ? "border-[#1c1c1c] text-[#1c1c1c]" : "border-transparent text-[#aeaeb2]"
          }`}
        >
          <FileText className="w-4 h-4" /> Başvuru
        </button>
      </div>
      <div className="lg:hidden flex-1 overflow-auto p-4">
        {mobileTab === "eval" ? (
          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
            <EvaluationForm
              applicationId={application.id}
              canEvaluate={canEvaluate}
              existingEvaluation={existingEvaluation}
            />
          </div>
        ) : (
          <ApplicationAccordion
            application={application}
            files={files}
            showFileNotes
            canEvaluate={canEvaluate}
          />
        )}
      </div>
    </>
  )
}

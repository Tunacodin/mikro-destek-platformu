"use client"

import { useState } from "react"
import { FileText, ClipboardList, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from "lucide-react"

export function EvaluateLayout({
  headerBar,
  applicationPanel,
  evaluationPanel,
}: {
  headerBar: React.ReactNode
  applicationPanel: React.ReactNode
  evaluationPanel: React.ReactNode
}) {
  const [activeTab, setActiveTab] = useState<"app" | "eval">("app")
  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [rightCollapsed, setRightCollapsed] = useState(false)

  return (
    <div className="h-full flex flex-col bg-[#fafafa]">

      {/* Sabit üst bar */}
      {headerBar}

      {/* Mobil: tab bar */}
      <div className="lg:hidden shrink-0 flex bg-white border-b border-[#e8e8e8]">
        <button
          onClick={() => setActiveTab("app")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-[13px] font-medium transition-colors cursor-pointer border-b-2 ${
            activeTab === "app"
              ? "border-[#1c1c1c] text-[#1c1c1c]"
              : "border-transparent text-[#aeaeb2] hover:text-[#6e6e73]"
          }`}
        >
          <FileText className="w-4 h-4" />
          Başvuru
        </button>
        <button
          onClick={() => setActiveTab("eval")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-[13px] font-medium transition-colors cursor-pointer border-b-2 ${
            activeTab === "eval"
              ? "border-[#1c1c1c] text-[#1c1c1c]"
              : "border-transparent text-[#aeaeb2] hover:text-[#6e6e73]"
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Değerlendirme
        </button>
      </div>

      {/* Mobil: aktif tab içeriği */}
      <div className="lg:hidden flex-1 overflow-auto p-4">
        {activeTab === "app" ? applicationPanel : (
          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
            {evaluationPanel}
          </div>
        )}
      </div>

      {/* Desktop: split view */}
      <div className="hidden lg:flex flex-1 overflow-hidden">

        {/* Sol panel: Başvuru detayları */}
        {leftCollapsed ? (
          <div className="shrink-0 border-r border-[#e8e8e8] bg-white flex flex-col items-center py-3 px-1.5">
            <button
              onClick={() => setLeftCollapsed(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#aeaeb2] hover:text-[#1c1c1c] hover:bg-[#f0f0f0] transition-colors cursor-pointer"
              title="Başvuru panelini aç"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
            <p className="text-[10px] text-[#aeaeb2] mt-2 [writing-mode:vertical-lr] rotate-180">Başvuru</p>
          </div>
        ) : (
          <div className="border-r border-[#e8e8e8] bg-white flex flex-col transition-all duration-300 w-1/2">
            <div className="shrink-0 px-5 py-3 border-b border-[#e8e8e8] flex items-center justify-between">
              <p className="text-[13px] font-semibold text-[#1c1c1c] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#aeaeb2]" />
                Başvuru Detayları
              </p>
              <button
                onClick={() => setLeftCollapsed(true)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#aeaeb2] hover:text-[#1c1c1c] hover:bg-[#f0f0f0] transition-colors cursor-pointer"
                title="Paneli daralt"
              >
                <PanelLeftClose className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {applicationPanel}
            </div>
          </div>
        )}

        {/* Sağ panel: Değerlendirme formu */}
        {rightCollapsed ? (
          <div className="shrink-0 border-l border-[#e8e8e8] bg-white flex flex-col items-center py-3 px-1.5">
            <button
              onClick={() => setRightCollapsed(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#aeaeb2] hover:text-[#1c1c1c] hover:bg-[#f0f0f0] transition-colors cursor-pointer"
              title="Değerlendirme panelini aç"
            >
              <PanelRightOpen className="w-4 h-4" />
            </button>
            <p className="text-[10px] text-[#aeaeb2] mt-2 [writing-mode:vertical-lr] rotate-180">Değerlendirme</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col bg-[#fafafa] min-w-0">
            <div className="shrink-0 px-5 py-3 border-b border-[#e8e8e8] bg-white flex items-center justify-between">
              <p className="text-[13px] font-semibold text-[#1c1c1c] flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-[#aeaeb2]" />
                Değerlendirme Formu
              </p>
              <button
                onClick={() => setRightCollapsed(true)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#aeaeb2] hover:text-[#1c1c1c] hover:bg-[#f0f0f0] transition-colors cursor-pointer"
                title="Paneli daralt"
              >
                <PanelRightClose className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
                {evaluationPanel}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

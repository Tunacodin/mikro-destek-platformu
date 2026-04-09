"use client"

import { useState } from "react"
import { FileText, ClipboardList } from "lucide-react"

export function EvaluateTabs({
  filesPanel,
  evalPanel,
}: {
  filesPanel: React.ReactNode
  evalPanel: React.ReactNode
}) {
  const [activeTab, setActiveTab] = useState<"files" | "eval">("files")

  return (
    <>
      {/* Mobil tab bar */}
      <div className="lg:hidden shrink-0 flex border-b border-black/[0.06] bg-white">
        <button
          onClick={() => setActiveTab("files")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-[13px] font-semibold transition-colors border-b-2 ${
            activeTab === "files"
              ? "border-[#1c1c1c] text-[#1c1c1c]"
              : "border-transparent text-[#aeaeb2] hover:text-[#6e6e73]"
          }`}
        >
          <FileText className="w-4 h-4" />
          Dosyalar
        </button>
        <button
          onClick={() => setActiveTab("eval")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-[13px] font-semibold transition-colors border-b-2 ${
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
        {activeTab === "files" ? filesPanel : evalPanel}
      </div>

      {/* Desktop: split view */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        <div className="w-1/2 border-r border-black/[0.06] overflow-y-auto p-5">
          {filesPanel}
        </div>
        <div className="w-1/2 overflow-y-auto p-5">
          {evalPanel}
        </div>
      </div>
    </>
  )
}
